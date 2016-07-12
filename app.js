const express = require('express')
const logger = require('morgan')
const config = require('config')
const debug = require('debug')('receiver:app')
const bodyParser = require('body-parser')
const app = express()
const SlackWebhook = require('slack-webhook')
const slack = new SlackWebhook(
  config.get('slack.webhook'),
  {
    defaults: config.get('slack.defaults')
  }
)

debug('booting', process.env.NODE_ENV)

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function (req, res, next) {
  res.end('nothing to see here, move along')
})
app.post('/', function (req, res, next) {
  const body = req.body

  debug(body.data)

  if (body.type !== 'visits.created' || !body.data) {
    return res.status(400).send('something went wrong')
  }
  if (!body.data.visitor) {
    return res.status(400).send('something went wrong')
  }

  const message = `${body.data.visitor.first_name} ${body.data.visitor.last_name} has checked in`

  slack.send({
    text: message
  }).then(function (response) {
    res.send('ok')
  }).catch(function (err) {
    debug(err)
    res.status(500).send('something went wrong')
  })
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers
// ---------------
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.send({
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.send({
    message: err.message,
    error: {}
  })
})

module.exports = app
