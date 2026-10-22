# Nôm Component Explorer data

Generated files for the Nôm Component Explorer tool
(`src/app/[locale]/tools/han-nom-tools/nom-component-explorer`):

- `index.json`: every structure line of Tự điển chữ Nôm dẫn giải
  (`data/dictionaries/tu-dien-chu-nom-dan-giai/tdcndg.xml`), parsed into type
  codes, components, readings, glosses and citations per source.
- `mc.json`: Guangyun (Middle Chinese) readings for component characters, from
  the tshet-uinh library (nk2028, MIT licence).
- `sources.json`: the dictionary's quoted sources with dates, transcribed by hand
  from `tdcndg_refs.xml` (edit this file to correct a date).

They are built in the standalone explorer project (`npm run build-index`) and
copied here with its `scripts/port-to-dvn.py`.
