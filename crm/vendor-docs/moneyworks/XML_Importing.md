# XML Importing

MoneyWorks supports import and export of XML-formatted data. This removes the need to preconfigure an import map when building automated importing scripts (although you will still need to understand import maps). XML is the only import format supported by the REST interface.

For manually invoked XML import, there is an XML option in the **Import** menu, and you can also drag & drop `.xml` files into list windows to invoke an import (provided there are no errors, it will just happen). You can also copy XML text and paste it directly into a MoneyWorks list.

XML files to be imported must be valid XML and must provide the necessary fields to specify valid record data for MoneyWorks. For example, if importing a transaction, the transaction line items must add up and agree with the transaction total; the transaction type and necessary fields such as `Contra` must be specified. This is no more or less than you would do with an Import Map. You can’t just throw some partial data in and expect MoneyWorks to read your mind about what it means[^1].

## XML file format

The import format is compatible with the XML export format that MoneyWorks produces. You can export a table using the REST APIs, for example:

```
http:// ... /REST/Acme%20Widgets/export/table=name&format=xml
```

And also from the command line, for example:

```
moneyworks -e 'export table="transaction" format="xml"'
    document.moneyworks
```

This exports the entire transaction table to `stdout`.

The import file may contain a single `<table>` element, or may contain an `<import>` element with multiple `<table>` elements within it. The `<table>` elements can be for different tables.

- The `<table>` element must have a `name` attribute specifying the target table for the import.  
- The `<table>` element will contain multiple record elements, whose element name will be the table name (e.g. `<transaction>`).  
- Each record element will contain a set of field elements whose names are valid fieldnames from the MoneyWorks schema (e.g. `<ourref>`). See [Appendix A—Field Descriptions](moneyworks_appendix_appendix_afield_descriptions.html#34774) for table and field names.

#### Important
Note that localised formats are not used for date and numbers. Dates must be specified in `YYYYMMDD` format. Numbers must be formatted without thousands separators, and non-integers must use `.` as the decimal separator.

As a special case, transaction elements will also contain a `<subfile>` element, which will contain multiple `<detail>` elements specifying the line items for the transaction.

```xml
<?xml version="1.0"?>
<table name="Transaction">
  <transaction>
    <ourref>2116</ourref>
    <transdate>20101220</transdate>
    <duedate>20110120</duedate>
    <type>DII</type>
    <theirref>213544</theirref>
    <namecode>BROWN</namecode>
    <description>Widget Sales</description>
    <gross>1008.56</gross>
    <contra>1500</contra>
    <tofrom>Brown Suppliers</tofrom>
    <subfile name="Detail">
      <detail>
        <detail.account>4000-1</detail.account>
        <detail.taxcode>6</detail.taxcode>
        <detail.gross>779.62</detail.gross>
        <detail.tax>86.62</detail.tax>
        <detail.net>693.00</detail.net>
        <detail.description>Chrome Taper Widget</detail.description>
        <detail.stockqty>7.000000</detail.stockqty>
        <detail.stockcode>C2800</detail.stockcode>
        <detail.costprice>35.000000</detail.costprice>
        <detail.unitprice>99.000000</detail.unitprice>
        <detail.saleunit>ea</detail.saleunit>
      </detail>
    </subfile>
  </transaction>
</table>
```

The Work-it-Out facility for fields that support it can be invoked with an empty field name tag with the attribute `work-it-out="true"` (you can determine such support by checking the relevant field in the usual importing configuration dialog—if the field options support work-it-out there, then it is supported by the XML importer). For example:

```
<transdate work-it-out="true" />
```

Likewise, calculations can be done using the `calculated` attribute. In this case, the text within the element is treated as an expression whose result is used as the actual import data for the element. If you are referencing imported fields, those fields must have appeared earlier in the XML file. For example:

```
<user1 calculated="true">Lookup(NameCode, "name.Category2")</user1>
```

Fields and subrecords with the attribute `system="true"` will be ignored by the importer.

## Additional table attributes for controlling the import

Where appropriate, the same import options available in the regular import can be specified as attributes of the `<table>` element.

### Transaction table attributes

The following attributes may be specified for the `transactions` table. They correspond to the equivalent setting in the Transaction import options dialog or the parameter to the regular scripted import:

- `create_names="true"`
- `create_jobs="true"`
- `rounding_tolerance="D"` (where `D` is a dollar amount; `0.02` is the default)
- `negate_in="true"`
- `negate_out="true"`
- `update="true" seqnum="N"` — where `N` is a sequence number. Allows Debtor Invoices to be "recalled" (replaced or cancelled and replaced depending on whether posted or not).
- `return_seq="true"` — response of the import command will be a sequence number of the last record imported instead of a success notification.
- `post="true" seqnum="N"` — where `N` is a sequence number.
- `discard="true" seqnum="N"` — where `N` is a sequence number of unposted trans to be deleted. (This usage is deprecated.)

### For Importing Names, Jobs, and Products (Items)

- `update="true"` — General update case for non-transaction tables (Items, Jobs, Names) — updates the provided fields.

## Payments on invoices

The XML format for importing payments on invoices is slightly non-obvious. The table `name` attribute for the import needs to be `"payments"`, but the top-level records that you import are `<transaction>`, with subrecords of `<payments>`.

For example:

```xml
<?xml version="1.0"?>
<table name="payments">
    <transaction>
        <namecode>GREEN</namecode>
        <ourref>123456</ourref>
        <transdate>20101030</transdate>
        <gross>380.25</gross>
        <contra>1001</contra>
        <subfile name="payments">
            <payments>
                <invoiceid>2041</invoiceid>
                <amount>380.25</amount>
            </payments>
        </subfile>
    </transaction>
</table>
```

**Note:** Unlike an import map, the order of the fields is important. Thus, in importing a transaction, the following:

```xml
<?xml version="1.0"?>
<table name="transaction">
    <transaction>
        <ourref work-it-out="true" />
        <type>DI</type>
        ...
```

will not produce the same value for `ourref` as:

```xml
<?xml version="1.0"?>
<table name="transaction">
    <transaction>
        <type>DI</type>
        <ourref work-it-out="true" />
        ...
```

because the value of `ourref` will be worked out based on the transaction type, which is undefined in the first example. In the second example, MoneyWorks knows that you are importing a Debtor Invoice (Sales Invoice), so it knows how to work out the `ourref` value.
