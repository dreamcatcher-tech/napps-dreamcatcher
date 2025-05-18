## Appendix A—Field Descriptions

This appendix describes the field names you’ll see in the Find and Sort dialog
boxes, as well as when importing or preparing an analysis report. The fields and
file names are also accessible from external scripts. A simplified schema is
shown at [Schema](moneyworks_appendix_simplified_schema.html#67931).

The letter after the field name denotes the type of the field:

| Type | Description                                                                 |
| ---- | --------------------------------------------------------------------------- |
| A    | Alphanumeric (like Text, but fixed-length and cannot be wildcard-searched). |
| B    | Boolean (always "True" or "False").                                         |
| D    | Date (entered as `DD/MM/YY`, e.g. `21/2/68`).                               |
| N    | Numeric.                                                                    |
| S    | Date and time (cannot be searched by equality operator).                    |
| T    | Text (can be wildcard-searched using the `@` character).                    |

The number after T and A indicates the maximum length of the field.

The internal name is used when referencing the file from external scripts. The
names of indexed fields are in **bold**.

**Note**: Changes to the schema introduced in MoneyWorks 8 appear in highlighted
text.

### Note on UserNum and UserText fields

Many tables include these fields. They’re for your own use and can be accessed
via script or importing. For instance, if you import transactions from another
system and want to store that system’s ID, `transaction.usernum` or
`transaction.usertext` works well.

### Note on the TaggedText field

`TaggedText` is added to many tables for storing key-value pairs. Only access it
using the special routines in `mwScript`.
