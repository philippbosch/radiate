class Radiate
    constructor: (@server, @pusher_key) ->
        @pusher = new Pusher(pusher_key)
        @channel = @pusher.subscribe('updates')

    onupdate: (key, callback) ->
        @channel.bind "update:#{key}", callback

    get: (key, callback) ->
        xhr = new XMLHttpRequest()
        xhr.open("GET", "#{@server}/#{key}", true)
        xhr.onreadystatechange = ->
            return if xhr.readyState != 4
            data = JSON.parse(xhr.responseText)
            callback(data)
        xhr.send(null)

    set: (key, value, callback) ->
        xhr = new XMLHttpRequest()
        xhr.open("PUT", "#{@server}/#{key}", true)
        xhr.onreadystatechange = ->
            return if xhr.readyState != 4
            data = JSON.parse(xhr.responseText)
            callback(data)
        data = value: value
        xhr.send(JSON.stringify(data))

    incr: (key, callback) ->
        xhr = new XMLHttpRequest()
        xhr.open("PUT", "#{@server}/#{key}", true)
        xhr.onreadystatechange = ->
            return if xhr.readyState != 4
            data = JSON.parse(xhr.responseText)
            callback(data)
        data = action: 'INCR'
        xhr.send(JSON.stringify(data))

    decr: (key, callback) ->
        xhr = new XMLHttpRequest()
        xhr.open("PUT", "#{@server}/#{key}", true)
        xhr.onreadystatechange = ->
            return if xhr.readyState != 4
            data = JSON.parse(xhr.responseText)
            callback(data)
        data = action: 'DECR'
        xhr.send(JSON.stringify(data))



window.radiate = new Radiate('__RADIATE_SERVER__', '__PUSHER_KEY__')
