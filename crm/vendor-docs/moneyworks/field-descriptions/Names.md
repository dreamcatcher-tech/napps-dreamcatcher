# Names

Internal name _Name_.

| **Field**                  | **Type** | **Size** | **Notes**                                                                              |
| -------------------------- | -------: | -------: | -------------------------------------------------------------------------------------- |
| ABUID                      |        S |          | Mac Address Book Universal ID—set for imported address book entries only               |
| Account Name               |        T |       21 | The bank account name (e.g. XYZ Trading Company)                                       |
| Address1                   |        T |       59 | Mailing Address (first line)                                                           |
| Address2                   |        T |       59 | Mailing Address (second line)                                                          |
| Address3                   |        T |       59 | Mailing Address (third line)                                                           |
| Address4                   |        T |       59 | Mailing Address (fourth line)                                                          |
| Afterhours                 |        T |       11 | After hours phone number for contact 1                                                 |
| Afterhours2                |        T |       11 | After hours phone number for contact 2                                                 |
| Bank                       |        T |        7 | The customer's bank (e.g. BNZ)                                                         |
| BankAccountNumber          |        T |       23 | The bank account number of the name, as supplied by their bank                         |
| BankBranch                 |        T |       21 | The bank branch (e.g. Main St.)                                                        |
| Category1                  |        T |       15 | User defined                                                                           |
| Category2                  |        T |       15 | User defined                                                                           |
| Category3                  |        T |       15 | User defined                                                                           |
| Category4                  |        T |       15 | User defined                                                                           |
| CCurrent                   |        N |          | For a creditor, the current balance.                                                   |
| **Code**                   |        T |       11 | The name code. For non-sundries, only the first ten characters are used.               |
| Colour                     |        N |          | A numeric index (0–7) internally; rendered as a textual colour name                    |
| Comment                    |        T |     1020 | A comment                                                                              |
| Contact                    |        T |       25 | Contact person 1 in the company                                                        |
| Contact2                   |        T |       29 | Name of contact person 2                                                               |
| CreditCardExpiry           |        T |        5 | Expiry date of credit card                                                             |
| CreditCardName             |        T |       19 | Name on credit card                                                                    |
| CreditCardNum              |        T |       19 | Credit card number                                                                     |
| CreditLimit                |        N |          | The credit limit for a debtor                                                          |
| CreditorTerms              |        N |          | If > 0, within N days; if < 0, Nth day of month following                              |
| Currency                   |        T |        3 | Currency of customer/supplier (blank if local)                                         |
| Custom1                    |        T |      255 | For your own use                                                                       |
| Custom2                    |        T |      255 | For your own use                                                                       |
| Custom3                    |        T |       15 | For your own use                                                                       |
| Custom4                    |        T |       15 | For your own use                                                                       |
| Custom5                    |        T |       15 | For your own use                                                                       |
| Custom6                    |        T |       15 | For your own use                                                                       |
| Custom7                    |        T |       15 | For your own use                                                                       |
| Custom8                    |        T |       15 | For your own use                                                                       |
| **CustomerType**           |        N |          | 0 for not a customer, 1 for customer, 2 for debtor                                     |
| CustPropmtPaymentDiscount  |        N |          | Prompt payment discount percentage                                                     |
| CustPromptPaymentTerms     |        N |          | 0 for no prompt payment; > 0 for within N days; < 0 for by Nth date of following month |
| D30Plus                    |        N |          | Debtor 30 day balance (1 cycle of manual ageing).                                      |
| D60Plus                    |        N |          | Debtor 60 day balance (2 cycles of manual ageing).                                     |
| D90Plus                    |        N |          | Debtor 90 days+ balance (3 cycles of manual ageing).                                   |
| DateOfLastSale             |        D |          | Date of last invoice or cash sale                                                      |
| DBalance                   |        N |          | Sum of D90Plus, D60Plus, D30Plus and DCurrent                                          |
| DCurrent                   |        N |          | For a debtor, the current balance (part of total debtor balance).                      |
| DDI                        |        T |       19 | Direct dial number for contact 1                                                       |
| DDI2                       |        T |       19 | Direct dial number for contact 2                                                       |
| DebtorTerms                |        N |          | If > 0, within N days; if < 0, Nth day of month following                              |
| Delivery1                  |        T |       59 | Delivery address (first line)                                                          |
| Delivery2                  |        T |       59 | Delivery address (second line)                                                         |
| Delivery3                  |        T |       59 | Delivery address (third line)                                                          |
| Delivery4                  |        T |       59 | Delivery address (fourth line)                                                         |
| DeliveryPostcode           |        T |       12 | Postcode/zipcode of delivery address                                                   |
| DeliveryState              |        T |        4 | State of delivery address                                                              |
| Discount                   |        N |          | Discount field for a customer                                                          |
| EInvoiceID                 |        T |       31 | eInvoicing ID for Peppol Access Point (ABN in AU, NZBN in NZ)                          |
| email                      |        T |       80 | email address for contact 1                                                            |
| email2                     |        T |       80 | email address for contact 2                                                            |
| Fax                        |        T |       19 | Facsimile number                                                                       |
| Flags                      |        N |          | See Names Flags table                                                                  |
| Hold                       |        B |          | “True” if the debtor is on hold, “False” otherwise                                     |
| **Kind**                   |        N |          | The kind of Name. 0 = template, 1 = normal                                             |
| LastModifiedTime           |        S |          | Date and Time the record was last modified                                             |
| LastPaymentMethod          |        N |          | PaymentMethod used in previous transaction                                             |
| Memo                       |        T |      255 | Memo/notes for contact 1                                                               |
| Memo2                      |        T |      255 | Memo/notes for contact 2                                                               |
| Mobile                     |        T |       14 | Mobile phone number for contact 1                                                      |
| Mobile2                    |        T |       13 | Mobile phone number for contact 2                                                      |
| Name                       |        T |      255 | Name of company                                                                        |
| PayAccount                 |        T |        7 | The Accounts Payable control account code for a creditor                               |
| PaymentMethod              |        N |          | Payment method (0 = None, 1 = Cash, 2 = Cheque, 3 = Electronic, etc.)                  |
| Phone                      |        T |       19 | Phone number                                                                           |
| Position                   |        T |       29 | Position of contact person 1                                                           |
| Position2                  |        T |       29 | Position of contact 2                                                                  |
| PostCode                   |        T |       11 | Post code                                                                              |
| ProductPricing             |        T |        1 | Pricing level for customer (A–F)                                                       |
| RecAccount                 |        T |        7 | The Accounts Receivable control account code for a debtor                              |
| ReceiptMethod              |        N |          | Preferred payment method of customers (1 = Cash, 2 = Cheque, etc.)                     |
| Role                       |        N |          | Bitmapped roles for contact 1                                                          |
| Role2                      |        N |          | Bitmapped roles for contact 2                                                          |
| SalesPerson                |        T |        5 | Salesperson code; auto-copied to transaction.salesperson field                         |
| Salutation                 |        T |       39 | Salutation for contact 1                                                               |
| Salutation2                |        T |       39 | Salutation for contact 2                                                               |
| SplitAcct1                 |        T |       13 | Account code for first split account                                                   |
| SplitAcct2                 |        T |       13 | Account code for remainder split account                                               |
| SplitPercent               |        N |          | Percent of allocation to be put into SplitAcct1                                        |
| State                      |        T |        3 | State (for postal address)                                                             |
| **SupplierType**           |        N |          | 0 for not a supplier, 1 for supplier, 2 for creditor                                   |
| SuppPromptPaymentDiscount  |        N |          | Prompt payment discount offered by supplier                                            |
| SupplierPromptPaymentTerms |  (empty) |  (empty) | 0 for no prompt payment; > 0 for within N days; < 0 for by Nth date of following month |
| TaggedText                 |        T |      255 | Scriptable tag storage                                                                 |
| TaxCode                    |        A |        5 | Tax code override                                                                      |
| TaxNumber                  |        T |       19 | Their tax number (GST#, VAT#, ABN, etc.)                                               |
| TheirRef                   |        T |       15 | The code by which the supplier/customer refers to your company                         |
| UserNum                    |        N |          | User defined                                                                           |
| UserText                   |        T |      255 | User defined                                                                           |
| WebURL                     |        T |       63 | Web URL                                                                                |

## Name Flags

Use `TestFlags()`, `Setflag()`, and `ClearFlag()` functions for flags.

| Flag                  | Value  |   |   |
| --------------------- | ------ | - | - |
| Requires order number | 0x0001 |   |   |
