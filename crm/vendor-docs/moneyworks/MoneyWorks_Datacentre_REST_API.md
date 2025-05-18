# MoneyWorks Datacentre REST API

## Synopsis

The MoneyWorks Datacentre REST API provides a simple, platform-neutral,
stateless network interface to MoneyWorks Datacentre.

## Description

The MoneyWorks REST API is hosted on a MoneyWorks Datacentre server
(on-premises, cloud VM, or MoneyWorks Now). There is no single URL. On a
self-hosted server, ensure the network config is set up for external access if
needed.

By default, the REST API runs on port 6710 but can be changed. TLS (https) is
recommended if configured with an appropriate certificate.

The server uses MoneyWorks CLI instances to service REST requests. A pool of
logged-in instances stays alive for ~30 seconds for efficiency. Avoid periodic
polling with frequency <10 minutes to prevent unnecessary database openings and
high load.

## Authentication

MoneyWorks Datacentre REST API uses **Basic Password** authentication.

### Single-level (document password only)

If `Login_required` is **not** in the `Server:` header, then only document
credentials are needed. Supply:

```
Authorization: Basic base64( "username:Document:password" )
```

### Two-level (folder + document password)

If the `Server:` header includes `Login_Required`, supply **two** Authorization
headers or one combined header with commas:

```
Authorization: Basic base64( "Some Folder:Datacentre:folderpass" )
Authorization: Basic base64( "Robot:Document:s3cret" )
```

or

```
Authorization: Basic base64( "Some Folder:Datacentre:folderpass" ), Basic base64( "Robot:Document:s3cret" )
```

Order does not matter.

#### CURL Examples

- **Recommended** (credentials in separate headers):
  ```shell
  curl \
    -H "Authorization: Basic `echo -n 'Folder/sub folder:Datacentre:FPASS' | openssl base64`" \
    -H "Authorization: Basic `echo -n 'Admin:Document:DPASS' | openssl base64`" \
    "https://example.moneyworks.net.nz:6710/REST/Folder%2fsub%20folder%2fDocument.moneyworks/export/table=login&format=xml"
  ```

- **Not recommended** (doc credentials in URL):
  ```shell
  curl \
    -H "Authorization: Basic `echo -n 'Folder/sub folder:Datacentre:FPASS' | openssl base64`" \
    "https://example.moneyworks.net.nz:6710/REST/Admin:DPASS@Folder%2fsub%20folder%2fDocument.moneyworks/export/table=login&format=xml"
  ```

## API

General URIs for the REST API:

```
https://server:6710/REST/Document_Path/command?param=value
```

…for operations on a database document, or…

```
https://server:6710/REST/server/command?param=value
```

…for simple server queries (`version`, `list`).

### Document Path

- Must be URL-encoded (`%2f` for `/` in subfolders).
- Consider URIs case-sensitive.
- Commands (verb endpoints): **version, list, export, import, evaluate, post,
  doreport, doform, image**.

### Server Information Commands

#### `version`

```
GET /REST/server/version
```

No credentials required. Returns the Datacentre version as `text/plain`. E.g.:

```
HTTP/1.1 200 OK
Server: MoneyWorks_Datacentre/9.0 REST/9.0 Login_Required
Content-Type: text/plain

9.0
```

If per-folder login is required, `Login_Required` appears in the `Server:`
header.

#### `list`

```
GET /REST/server/list
Authorization: Basic base64("root:Datacentre:folderpassword")
```

Lists documents (databases) on the server/folder in `text/xml`:

```xml
<documents>
  <document>Acme.moneyworks</document>
  <document>CognitoAccounts.moneyworks</document>
</documents>
```

If authenticated for a specific subfolder, only that subfolder’s documents are
returned.

> **Do not** use `list` for server-availability checking—it's relatively
> expensive.

## Requests Operating on a Document

```
https://server:6710/REST/DocumentName.moneyworks/command?param=value
```

- _DocumentName_ is case-sensitive. If in a subfolder, separate with `%2f`.
- Credentials can be placed in the URL if needed (not recommended).

## Requests With Parameters

Use `?` or `/` then `paramName=paramValue` separated by `&`. Encode symbols (`=`
→ `%3d`).

## `export`

Principal means of extracting info:

```
GET /REST/DocumentName.moneyworks/export
```

**Params**:

- `table=tablename` (required)
- `search=expr` (MoneyWorks formula syntax, optional)
- `format=xml|xml-terse|xml-verbose|format-expr` (optional)
- `sort=expr` (optional)
- `direction=ascending|descending` (optional)
- `start=N, limit=N` (paging if `format=xml`)

By default, exports plain text. `xml-terse` omits blank/system fields;
`xml-verbose` includes them. Custom formats can be specified with a format
expression.

### Example: XML Export

```
GET /REST/Acme.moneyworks/export/table=name&search=Category1%3d%22NORTH%22&limit=2&format=xml
```

```
HTTP/1.1 200 OK
Content-Type: text/xml

<?xml version="1.0"?>
<table name="Name" count="2" start="0" found="6">
  <name>
    <code>AUTUMN</code>
    ...
  </name>
  <name>
    <code>BROWN</code>
    ...
  </name>
</table>
```

### Example: Plain Text Export (default)

```
GET /REST/Admin:fred@Acme.moneyworks/export/table=name&search=Category1%3d%22NORTH%22
```

```
HTTP/1.1 200 OK
Content-Type: text/plain

0   2   24/09/11 7:44:58 PM  AUTUMN  Autumn Fabrix Ltd ...
...
```

## `import`

Creates/updates records via POST:

```
POST /REST/DocumentName.moneyworks/import
```

Payload is **XML** (like `xml-terse` export). See
[MoneyWorks XML Importing](https://www.cognito.co.nz/manual/moneyworks_export_import_xml_importing.html)
for details.

**Optional param**: `return_seq=true` returns the seqnum of the last record
updated.

**Response**:

- `created N; updated M` (text/plain), or
- `[ERROR]...` if invalid records.

## `evaluate`

Evaluate an expression:

```
GET /REST/DocumentName.moneyworks/evaluate/expr=expression
```

Returns the result in `text/plain`. Example:

```
GET /REST/Acme.moneyworks/evaluate/expr=Today%28%29
-> 31/01/11
```

## `post`

Post an existing transaction:

```
POST /REST/DocumentName.moneyworks/post/seqnum=sequencenumber
```

Returns `OK` or `not posted`.

## `doreport`

Run a report:

```
GET /REST/DocumentName.moneyworks/doreport
```

**Params**:

- `report=name` (required)
- `format=html|text|pdf`
- `from=yyyymmdd|nnnn`
- `to=yyyymmdd|nnnn`
- `font=fontname`
- `size=pts`
- `leading=pts`
- `title=heading`
- `control-id=value`

Example:

```
GET /REST/doreport/report=Balance%20Sheet&format=html&leading=8&font=Verdana&size=10
```

Returns HTML or PDF as requested.

## `list` for Document

Lists available reports/forms when used with a document:

```
GET /REST/Acme.moneyworks/list/folder=reports
```

or

```
GET /REST/Acme.moneyworks/list/folder=forms
```

Returns XML enumerating items.

Querying for details of a specific report returns HTML-compatible `<controls>`
for custom parameters.

## `doform`

Generate a PDF form:

```
GET /REST/DocumentName.moneyworks/doform
```

**Params** (typical):

- `form=name`
- `search=expr`
- `Message=messagetext`
- `Print_Copy=1|0`
- `Include_Remit=1|0`
- `Stmt_Date=yyyymmdd`
- `Omit_Zero=1|0`
- `Omit_Credit=1|0`

Output is `application/pdf`.

## `image`

### GET

```
GET /REST/DocumentName.moneyworks/image/product=code
GET /REST/DocumentName.moneyworks/image/transaction=seqnum
GET /REST/DocumentName.moneyworks/image/key=ident
```

Returns an image (`image/png|jpg` or `application/pdf`).

### PUT

```
PUT /REST/DocumentName.moneyworks/image/product=code
PUT /REST/DocumentName.moneyworks/image/transaction=seqnum
```

Uploads/replaces an image for a product or transaction. Content-Type should be
image or PDF (for transactions). Transaction must not be locked.

## Concurrent Users and Availability

REST worker processes log in with your credentials, consuming a concurrent
login. If concurrency is saturated, requests fail. Worker processes linger
briefly for performance, holding the login slot for ~10-30s. If needed,
`no_linger=true` releases it immediately.

## History

- REST interface introduced in MoneyWorks Datacentre **6.1**
- HTTPS support added in **v7.1**
- HTTP/1.1 support added in **v8.0**
