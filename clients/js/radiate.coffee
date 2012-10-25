class Radiate
    constructor: (@server, @pusher_key) ->
        @pusher = new Pusher(pusher_key)
        @channel = @pusher.subscribe('updates')

    onupdate: (key, callback) ->
        @channel.bind "update:#{key}", callback

    get: (key, callback) ->
        xhr = new XMLHttpRequest()
        xhr.open("GET", "#{@server}/counter", true)
        xhr.onreadystatechange = ->
            return if xhr.readyState != 4
            data = JSON.parse(xhr.responseText)
            callback(data)
        xhr.send(null)


window.radiate = new Radiate('__RADIATE_SERVER__', '__PUSHER_KEY__')
