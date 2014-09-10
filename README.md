Symplectic import tool
=====

Install
=======

`npm install -d`

Run the script
===========================

```
Usage: ./bin/import.js --location [--created-since] [--ever-approved] [--groups] ["--content-types"]
 e.g.: ./bin/import.js -l ~/Documents -c 2014-09-01 -g 432 -t "journal article"

Options:
  -l, --location        The physical location where the file will be exported to (e.g. ~/Documents)
  -c, --created-since   The insertion start date of the publications (e.g. 2014-09-01')
  -e, --ever-approved   Whether the publications need to be approved or not (default: true)
  -g, --groups          The group where the publications belong to (e.g. 432)
  -t  --content-type    The content type of the resources to fetch (e.g. "journal article, book")
```
