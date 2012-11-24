class Radiate
    constructor: (@server, @pusher_key) ->
        @pusher = new Pusher(pusher_key)
        @channel = @pusher.subscribe('updates')

    onupdate: (key, callback) ->
        @channel.bind "update:#{key}", callback

    xhr: (method, key, data, callback) ->
        method = method.toUpperCase()
        if not callback? and typeof(data) == "function"
            callback = data
            data = null
        xhr = new XMLHttpRequest()

        xhr.open(method, "#{@server}/#{key}", true)

        if method != "GET"
            xhr.setRequestHeader('Content-Type', 'application/json')

        xhr.onreadystatechange = ->
            return if xhr.readyState != 4
            response = JSON.parse(xhr.responseText)
            if typeof(callback) == "function"
                callback(response)
        senddata = if method == "GET" then null else JSON.stringify(data)
        xhr.send(senddata)

    get: (key, callback) ->
        @xhr('GET', key, callback)

    set: (key, value, callback) ->
        if not typeof value == 'object'
            value = _value: value
        @xhr('PUT', key, value, callback)

    incr: (key, callback) ->
        @xhr('PUT', key, _action: 'INCR', callback)

    decr: (key, callback) ->
        @xhr('PUT', key, _action: 'DECR', callback)



window.radiate = new Radiate('__RADIATE_SERVER__', '__PUSHER_KEY__')


if jQuery
    jQuery.fn.radiate = (key) ->
        $elem = this
        key = key || $elem.data 'radiate-key'

        if key
          radiate.get key, (data) ->
              $elem.text data.value

          radiate.onupdate key, (data) ->
              $elem.text data.value
        else
          console.warn 'No key given'
