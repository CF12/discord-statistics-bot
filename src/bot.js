const fs = require('fs')
const path = require('path')
const Discord = require('discord.js')
const bot = new Discord.Client()
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const PresenceEntry = require('./PresenceEntry')
const MessageEntry = require('./MessageEntry')
const VoiceEntry = require('./VoiceEntry')

const dbExists = fs.existsSync((path.join(__dirname, '..', 'data')))

if (!dbExists) {
  fs.mkdirSync(path.join(__dirname, '..', 'data'))
  fs.openSync(path.join(__dirname, '..', 'data', 'db.json'), 'w')
}

const adapter = new FileSync(path.join(__dirname, '..', 'data', 'db.json'))
const db = low(adapter)

function getMsgId () {
  let id = db.get('id.msg').value() + 1

  db.set('id.msg', id)
    .write()

  return id
}

if (!dbExists) {
  db.defaults({
    id: {
      msg: 0
    },
    messages: [],
    states: {
      presence: [],
      voice: []
    }
  })
  .write()
}

// Loads configs
let config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'config.json')))

// Event handler for when the bot's ready
bot.on('ready', () => {
  console.log(`INFO >> Bot started.`)
})

// Event handler for when the bot detects a message
bot.on('message', (msg) => {
  let msgData = new MessageEntry(msg, getMsgId())

  db.get('messages')
    .push(msgData.getData())
    .write()
})

bot.on('presenceUpdate', (oldMember, newMember) => {
  let presenceData = new PresenceEntry(newMember)

  db.get('states.presence')
    .push(presenceData.getData())
    .write()
})

bot.on('voiceStateUpdate', (oldMember, newMember) => {
  let presenceData = new VoiceEntry(newMember)

  db.get('states.voice')
    .push(presenceData.getData())
    .write()
})

bot.login(config.bot_token)
