const { Wxapkg } = require('./lib/wxapkg')

let argv = require('minimist')(process.argv.slice(2),
  {
    alias: {
      m: 'more', p: 'port', h: 'help', H: 'host',
      s: 'subpack'
    }
  })

console.log(argv)

if (argv.h) {
  return console.log(`
Example usage:
-H --host     server host ip or dnsName
-p --port     port of host
-s --subpack  sub pack unpack
-m --more     more infomation
`)
}

const apkg = Wxapkg.init(argv)
apkg.start()