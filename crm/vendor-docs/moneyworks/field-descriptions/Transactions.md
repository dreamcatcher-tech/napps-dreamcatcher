# Transactions

**Internal Name**: `Transaction`. The details (transaction lines) are held in a
separate file named `Detail`, with `Detail.ParentSeq` holding the sequence
number of the parent transaction.

| **Field**                       | **Type** | **Size** | **Notes**                                                                                                                                                                                                                       |
| ------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aging                           | N        |          | The aging cycle for the transaction                                                                                                                                                                                             |
| AmtPaid                         | N        |          | The amount of the invoice that has been paid                                                                                                                                                                                    |
| AmtWrittenOff                   | N        |          | For invoices, the amount written off in a write-off                                                                                                                                                                             |
| Analysis                        | T        | 9        | The analysis field.                                                                                                                                                                                                             |
| ApprovedBy1                     | T        | 3        | Initials of first user to approve transaction. Can only be set to the current user's initials (or blank) via script.                                                                                                            |
| ApprovedBy2                     | T        | 3        | Initials of second user to approve transaction. Can only be set to the current user's initials (or blank) via script.                                                                                                           |
| BankJNSeq                       | N        |          | The sequence number of the journal which banked the receipt (using the Banking command)                                                                                                                                         |
| Colour                          | N        |          | The colour, represented as a numeric index (0–7), rendered as a textual colour name                                                                                                                                             |
| Contra                          | T        | 7        | For CP and CR transactions, the account code of the bank selected in the bank pop-up menu. For invoices, the accounts payable/receivable control acct.                                                                          |
| DatePaid                        | D        |          | The date the last payment for an invoice was made                                                                                                                                                                               |
| DeliveryAddress                 | T        | 255      | The delivery address for this transaction. Blank if default from name.                                                                                                                                                          |
| Description                     | T        | 1000     | The description of the transaction.                                                                                                                                                                                             |
| **Detail.Account**              | T        | 14       | Account code (or account-department code) from the detail line                                                                                                                                                                  |
| Detail.BackorderQty             | N        |          | The amount currently on backorder for an order                                                                                                                                                                                  |
| Detail.BaseCurrencyNet          | N        |          | The detail.net amount converted to the base currency                                                                                                                                                                            |
| Detail.CostPrice                | N        |          | Base currency buy-price (for purchases) or dollars per selling unit (for sales). For sales, cost price is taken from the product's AverageValue.                                                                                |
| Detail.Credit                   | N        |          | The credit value of the detail line. Amount by which the account is credited when posted (e.g., Net or Extension for a CP or CI).                                                                                               |
| Detail.Date                     | D        |          | The date on the detail line (also the expiry date for time-limited batches)                                                                                                                                                     |
| Detail.Custom1                  | T        | 31       | Scriptable text                                                                                                                                                                                                                 |
| Detail.Custom2                  | T        | 31       | Scriptable text                                                                                                                                                                                                                 |
| Detail.Debit                    | N        |          | The debit value of the detail line. Amount by which the account is debited when posted (e.g., Net or Extension for a CR or DI).                                                                                                 |
| Detail.Dept                     | T        | 5        | The department code                                                                                                                                                                                                             |
| Detail.Description              | T        | 1020     | The description for the detail line.                                                                                                                                                                                            |
| Detail.Discount                 | N        |          | The percent discount for the line.                                                                                                                                                                                              |
| Detail.ExpensedTax              | N        |          | The amount of non-claimable sales tax on the line (for CI/CP with sales tax). When saved, net is adjusted up and tax down. When viewed, reversed.                                                                               |
| Detail.Flags                    | N        |          | See **Detail Flags** table below, and `Detail.MoreFlags`.                                                                                                                                                                       |
| Detail.Gross                    | N        |          | The gross value of the detail line.                                                                                                                                                                                             |
| **Detail.JobCode**              | T        | 9        | The job code for the detail line.                                                                                                                                                                                               |
| Detail.MoreFlags                | N        |          | Additional detail flags (see table below)                                                                                                                                                                                       |
| Detail.NonInvRcvdNotInvoicedQty | N        |          | The quantity of non-inventoried items on an order received but not invoiced                                                                                                                                                     |
| Detail.OrderQty                 | N        |          | The original order quantity for an order                                                                                                                                                                                        |
| Detail.OrderStatus              | B        |          | 0 if not shipped or part shipped, 1 if fully shipped                                                                                                                                                                            |
| Detail.OriginalUnitCost         | N        |          | The unit cost of an inventoried item before the transaction was posted (some lines involving stock replenishment)                                                                                                               |
| **Detail.ParentSeq**            | N        |          | The sequence number of the parent transaction                                                                                                                                                                                   |
| Detail.Period                   | N        |          | Same as the transaction `Period` field                                                                                                                                                                                          |
| Detail.PostedQty                | N        |          | For stock purchase transactions, buy qty adjusted for product conversion factor (qty in sell units).                                                                                                                            |
| Detail.SaleUnit                 | A        | 3        | For product transaction detail lines, the selling unit of measure from the product record.                                                                                                                                      |
| Detail.SecurityLevel            | N        |          | The security level of the line (inherited from the account's security level)                                                                                                                                                    |
| Detail.SerialNumber             | N        |          | The item's serial/batch number                                                                                                                                                                                                  |
| **Detail.Statement**            | N        |          | The sequence number for the reconciliation record for which this detail line was reconciled. Normally only used for detail lines specifying a bank account. (0 if not reconciled, -1 if reconciliation saved but not finalized) |
| **Detail.StockCode**            | T        | 19       | The product code for the detail line. Blank if service-type transaction.                                                                                                                                                        |
| Detail.StockLocation            | T        | 15       | The item's location                                                                                                                                                                                                             |
| Detail.StockQty                 | N        |          | Quantity of product specified by `Detail.StockCode` that is being purchased or sold.                                                                                                                                            |
| Detail.Sort                     | N        |          | The order of the detail lines as displayed in a transaction                                                                                                                                                                     |
| Detail.TaggedText               | T        | 255      | Scriptable tag storage                                                                                                                                                                                                          |
| Detail.Tax                      | N        |          | The tax (GST, VAT etc) amount of the detail line.                                                                                                                                                                               |
| Detail.TaxCode                  | A        | 5        | The tax code of the account.                                                                                                                                                                                                    |
| Detail.TransactionType          |          |          | The first two characters of the transaction type (e.g., CP, CR, CI, DI, JN, PO, SO, QU)                                                                                                                                         |
| Detail.UnitPrice                | N        |          | For a purchase, same as the cost price. For a sale, the unit selling price (exclusive of GST/discount).                                                                                                                         |
| Detail.UserNum                  | N        |          | Scriptable number                                                                                                                                                                                                               |
| Detail.UserText                 | T        | 255      | Scriptable text                                                                                                                                                                                                                 |
| DueDate                         | D        |          | The date on which payment is due                                                                                                                                                                                                |
| Emailed                         | N        |          | Non-zero if transaction has been emailed                                                                                                                                                                                        |
| **EnterDate**                   | D        |          | The date on which the transaction was entered                                                                                                                                                                                   |
| EnteredBy                       | A        | 3        | Initials of user who entered the transaction                                                                                                                                                                                    |
| ExchangeRate                    | N        |          | The exchange rate (0 for base currency transactions)                                                                                                                                                                            |
| Flag                            | T        | 5        | The flag field.                                                                                                                                                                                                                 |
| Flags                           | N        |          | See **Transaction Flags** table below                                                                                                                                                                                           |
| FreightAmount                   | N        |          | Freight amount of order                                                                                                                                                                                                         |
| FreightCode                     | T        | 15       | Freight code used for orders                                                                                                                                                                                                    |
| FreightDetails                  | T        | 255      | Details of freight for order                                                                                                                                                                                                    |
| Gross                           | N        |          | The gross value of the transaction                                                                                                                                                                                              |
| Hold                            | B        |          | True if the transaction is on hold                                                                                                                                                                                              |
| LastModifiedTime                | S        |          | The date/time that the transaction was last changed                                                                                                                                                                             |
| MailingAddress                  | T        | 255      | Transaction's mailing address. Blank if default from name.                                                                                                                                                                      |
| **NameCode**                    | T        | 11       | Customer or Supplier Code                                                                                                                                                                                                       |
| OrderDeposit                    | N        |          | The accumulated deposit on an order                                                                                                                                                                                             |
| OrderShipped                    | N        |          | The amount shipped of an order                                                                                                                                                                                                  |
| OrderTotal                      | N        |          | The total of the order                                                                                                                                                                                                          |
| OriginatingOrderSeq             | N        |          | The sequence number of the order that created the invoice via ship or receive goods commands                                                                                                                                    |
| **OurRef**                      | T        | 11       | The reference number of the transaction (cheque # for CP, receipt # for CR, invoice # for DI, etc.). For Journals, the journal number prefixed with its type (e.g., JN, JS, BK).                                                |
| PayAmount                       | N        |          | The amount of the invoice elected to pay a creditor in the next payment run                                                                                                                                                     |
| PaymentMethod                   | N        |          | The payment method for the transaction (0=None, 1=Cash, 2=Cheque, 3=Electronic, 4=Credit Card, 5–7=user defined)                                                                                                                |
| **Period**                      | N        |          | Represents the transaction's period as (100*year + period), with year in [0–99] and period in [1–12].                                                                                                                           |
| PostedBy                        | A        | 3        | Initials of user who posted the transaction                                                                                                                                                                                     |
| Printed                         | N        |          | 0 if not printed; 1 if printed                                                                                                                                                                                                  |
| ProdPriceCode                   | T        | 1        | Pricing code (A–F)                                                                                                                                                                                                              |
| PromptPaymentAmt                | N        |          | The amount of the eligible prompt payment discount                                                                                                                                                                              |
| PromptPaymentDate               | D        |          | The date the prompt payment discount expires                                                                                                                                                                                    |
| Recurring                       | B        |          | "True" if the transaction is recurring; "False" otherwise                                                                                                                                                                       |
| SalesPerson                     | T        | 5        | The salesperson for the transaction. If the transaction involves products with "Append Salesperson" set, the value is appended to that product’s sales/cost-of-goods account code.                                              |
| SecurityLevel                   | N        |          | The transaction's security level, set to the highest security level of the visible detail lines.                                                                                                                                |
| SequenceNumber                  | N        |          | The sequence number of the transaction                                                                                                                                                                                          |
| SpecialAccount                  |          |          | For receipts, the bank account of the cheque                                                                                                                                                                                    |
| SpecialBank                     |          |          | For receipts, the bank number of the cheque                                                                                                                                                                                     |
| SpecialBranch                   |          |          | For receipts, the branch of the cheque                                                                                                                                                                                          |
| **Status**                      | T        | 1        | "U" = unposted, "P" = posted                                                                                                                                                                                                    |
| TaggedText                      | T        | 255      | Scriptable tag storage                                                                                                                                                                                                          |
| TaxAmount                       | N        |          | The amount of GST involved for the transaction.                                                                                                                                                                                 |
| TaxCycle                        | N        |          | The GST cycle (0 if not yet processed).                                                                                                                                                                                         |
| TheirRef                        | T        | 21       | For debtor invoices, customer's Order No. For creditor invoices, supplier invoice #. For receipts, cheque #.                                                                                                                    |
| TimePosted                      | S        |          | Date/time transaction is posted.                                                                                                                                                                                                |
| ToFrom                          | T        | 200      | For a payment, the "To" field; for a receipt, the "From" field.                                                                                                                                                                 |
| **TransDate**                   | D        |          | The transaction date.                                                                                                                                                                                                           |
| Transferred                     | N        |          | Non-zero if transaction has been sent as eInvoice                                                                                                                                                                               |
| **Type**                        | T        | 3        | The transaction type (e.g., CP, CR, CI, DI, JN, PO, SO, QU)                                                                                                                                                                     |
| User1                           | T        | 255      | User defined                                                                                                                                                                                                                    |
| User2                           | T        | 255      | User defined                                                                                                                                                                                                                    |
| User3                           | T        | 255      | User defined                                                                                                                                                                                                                    |
| User4                           | T        | 15       | User defined                                                                                                                                                                                                                    |
| User5                           | T        | 15       | User defined                                                                                                                                                                                                                    |
| User6                           | T        | 15       | User defined                                                                                                                                                                                                                    |
| User7                           | T        | 15       | User defined                                                                                                                                                                                                                    |
| User8                           | T        | 15       | User defined                                                                                                                                                                                                                    |
| UserNum                         | N        |          | Scriptable number                                                                                                                                                                                                               |
| UserText                        | T        | 255      | Scriptable text                                                                                                                                                                                                                 |

---

**Transaction type codes:**

| **Code** | **Description**                     |
| -------- | ----------------------------------- |
| CIC      | Creditor invoice—fully paid         |
| CII      | Creditor invoice—incomplete         |
| CP       | Cash payment/purchase               |
| CPC      | Cash payment for a creditor invoice |
| CPD      | Returned refund to debtor           |
| CR       | Cash receipt/sale                   |
| CRC      | Receive refund from creditor        |
| CRD      | Receipt for a debtor invoice        |
| DIC      | Debtor invoice—fully paid           |
| DII      | Debtor invoice—incomplete           |
| JN       | General journal                     |
| JNS      | Stock journal                       |
| POC      | Purchase order (complete) = Bought  |
| POI      | Purchase order (incomplete)         |
| QU       | Quote                               |
| SOC      | Sales order (complete) = Sold       |
| SOI      | Sales order (incomplete)            |

---

## Transaction Flags

Use `TestFlags()` to determine flags.

| **Flag**                                                                                                                                                               |    **Hex** | **Flag**                       |    **Hex** |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------: | ------------------------------ | ---------: |
| Was Cancelled                                                                                                                                                          | 0x00000001 | Is Job Invoice                 | 0x00002000 |
| Is Cancellation                                                                                                                                                        | 0x00000002 | Changed After Posting          | 0x00004000 |
| Was Written Off                                                                                                                                                        | 0x00000004 | Prompt Discount Taken          | 0x00008000 |
| Creditor Reimburse                                                                                                                                                     | 0x00000008 | Funds Xfer                     | 0x00010000 |
| Debtor Reimburse                                                                                                                                                       | 0x00000010 | Is Discount Credit Note        | 0x00020000 |
| Printed                                                                                                                                                                | 0x00000020 | Is Writeoff Credit Note        | 0x00040000 |
| Is WriteOff Dummy                                                                                                                                                      | 0x00000040 | Is New Style Sales Tax         | 0x00080000 |
| Is Contra Dummy                                                                                                                                                        | 0x00000080 | Has Scan                       | 0x00100000 |
| Journal Type (3 bits): <br> &nbsp;&nbsp;General=0, Make=1, <br> &nbsp;&nbsp;Break=2, WriteOff=4, <br> &nbsp;&nbsp;Create=5, Transfer=6, <br> &nbsp;&nbsp;Revaluation=7 | 0x00000700 | Has Outstanding Stock Receipts | 0x00200000 |
| Not On Statement                                                                                                                                                       | 0x00000800 | PPD Terms Locked               | 0x00400000 |
| Is Banking Journal                                                                                                                                                     | 0x00001000 | Is Deposit on Order            | 0x00800000 |
| Is a recurred transaction (v9.1.6)                                                                                                                                     | 0x08000000 | Imported transaction (v9.1.6)  | 0x01000000 |

---

## Detail Flags

`detail.flags` and `detail.moreFlags` hold flags for detail lines. Use
`TestFlags()` to check them.

### `detail.flags`

| **Flag**                       | **Hex** | **Flag**                       | **Hex** |
| ------------------------------ | ------: | ------------------------------ | ------: |
| System line                    |  0x8000 | Line is a foreign currency     |  0x0100 |
| Stock Journal Line             |  0x4000 | Balancing line for above       |  0x0200 |
| Banking Journal Bank Line      |  0x2000 | Balancing line for contra      |  0x0400 |
| Banking Journal Holding Line   |  0x1000 | Stock is ignored (for jobs)    |  0x0800 |
| Tax Line                       |  0x0008 | Tax line added by tax override |  0x0010 |
| Product Price is Tax Inclusive |  0x0004 | Is time item                   |  0x0020 |
| Freight Item                   |  0x0002 | Prompt Payment Discountable    |  0x0040 |
| Dept in account is salesperson |  0x0001 |                                |         |

### `detail.moreFlags`

| **Flag**               | **Hex** | **Flag**      | **Hex** |
| ---------------------- | ------: | ------------- | ------: |
| Requires serial number |  0x0001 | Batch expires |  0x0004 |
| Requires batch number  |  0x0002 |               |         |

---
