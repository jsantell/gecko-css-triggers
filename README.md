# Gecko CSS Triggers

A Firefox addon to collect CSS trigger data for [csstriggers.com](http://csstriggers.com).

## Running

Install [jpm](https://www.npmjs.com/package/jpm), and run this addon pointing to a nightly build
of firefox, or specify `nightly` for it to find it on your machine.

```
$ npm install jpm -g
$ cd gecko-css-triggers
$ jpm run -b nightly
```

Click the firefox icon in the toolbar to run through a series of tests. Check the console to see where the output file is saved in your temp directory.

## License

MIT License, Copyright (c) 2016 Jordan Santell
