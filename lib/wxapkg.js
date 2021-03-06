
const { Base } = require('./base')
const { WxCfg } = require('./wx-cfg')
const { WxJs } = require('./wx-js')
const { Wxml } = require('./wx-xml')
const { WxCss } = require('./wx-css')

class Wxapkg extends Base {
  constructor(dir, filename, subPack, moreInfo) {
    super(dir)
    this.subPack = subPack
    this.filename = filename
    this.moreInfo = moreInfo
  }
  static init(argv) {
    const filename = argv.d
    const dir = argv.s ? Wxapkg.getDir(argv.s) : Wxapkg.getDir(filename)
    const subPack = argv.s
    const moreInfo = argv.m ? true : false
    return new Wxapkg(dir, filename, subPack, moreInfo)
  }
  doFile() {

    const [buf, fileList] = this.preRead()

    this.saveFile(buf, fileList)

  }
  preRead() {
    const buf = this.getFileContent(this.filename, null)
    const [infoListLength, dataLength] = this.header(buf)
    const fileList = this.genList(buf.slice(14, infoListLength + 14))
    return [buf, fileList]
  }
  saveFile(buf, list) {
    for (const info of list) {
      const filename = this.getPathName((info.name.startsWith("/") ? "." : "") + info.name)
      const content = buf.slice(info.off, info.off + info.size)
      this.save(filename, content)
      this.getExactStoreDir(this.dir, info.name)
    }
  }
  header(buf) {
    console.log("\nHeader info:")
    let firstMark = buf.readUInt8(0)
    console.log("  firstMark: 0x%s", firstMark.toString(16))
    let unknownInfo = buf.readUInt32BE(1)
    console.log("  unknownInfo: ", unknownInfo)
    let infoListLength = buf.readUInt32BE(5)
    console.log("  infoListLength: ", infoListLength)
    let dataLength = buf.readUInt32BE(9)
    console.log("  dataLength: ", dataLength)
    let lastMark = buf.readUInt8(13)
    console.log("  lastMark: 0x%s", lastMark.toString(16))
    if (firstMark != 0xbe || lastMark != 0xed) throw Error("Magic number is not correct!")
    return [infoListLength, dataLength]
  }
  start() {
    // this.doFile()
    // if (!this.subPack)
    //   this.doConfig()
    // this.doCss()
    // this.doXml()
    this.doJs()
  }
  doXml() {
    const root = this.getSubRoot()
    const dir = root ? this.getPathName(root) : this.dir
    let filename = 'page-frame.html'
    if (this.isExistFile('page-frame.js', dir)) filename = 'page-frame.js'
    else if (this.isExistFile('app-wxss.js', dir)) filename = 'app-wxss.js'
    else if (!this.isExistFile(filename)) throw new Error('page-frame-like file is not found!')

    const xml = Wxml.init(dir, root, filename, this.moreInfo)
    xml.start()
  }
  doConfig() {
    // 
    const cfg = WxCfg.init(this.dir)
    cfg.start()
  }
  doCss() {
    const root = this.getSubRoot()
    const dir = root ? this.getPathName(root) : this.dir
    const cfg = WxCss.init(dir, root)
    cfg.start()
  }
  doJs() {
    const root = this.getSubRoot()
    const dir = root ? this.getPathName(root) : this.dir
    let filename = 'app-service.js'
    if (!this.isExistFile(filename)) throw new Error('app-service.js file is not found!')
    const cfg = WxJs.init(dir, root, filename)
    cfg.start()

    filename = 'workers.js'
    if (this.isExistFile(filename)) {
      const cfg = WxJs.init(dir, root, filename)
      cfg.start()
    }
  }
  getSubRoot() {
    if (!this.subPack) return null
    const [, fileList] = this.preRead()
    const [{ name }] = fileList
    const root = name.match(/(\w+)\//)[1]
    return root
  }
  packDone() {

  }
  genList(buf) {
    console.log("\nFile list info:")
    const fileCount = buf.readUInt32BE(0)
    console.log("  fileCount: ", fileCount)
    const fileInfo = []
    let off = 4
    for (let i = 0; i < fileCount; i++) {
      let info = {}
      let nameLen = buf.readUInt32BE(off)
      off += 4
      info.name = buf.toString('utf8', off, off + nameLen)
      off += nameLen
      info.off = buf.readUInt32BE(off)
      off += 4
      info.size = buf.readUInt32BE(off)
      off += 4
      fileInfo.push(info)
      // console.log(info)
    }
    return fileInfo
  }
}

module.exports = {
  Wxapkg
}