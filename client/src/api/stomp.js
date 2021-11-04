/**
* mystomp.js - Javascript STOMP client
*/
 
var socket;
var output;
  
var NULL_BYTE = 0x00;
var LINEFEED_BYTE = 0x0a;
var COLON_BYTE = 0x3a;
var SPACE_BYTE = 0x20;
 
/**
* Confirm log output when the webpage loads.
*/
 
function setup ()
{
    output = document.getElementById("output");
    log("Hello, World!");
};
 
/**
* The onclose handler is called when the connection is terminated
* by the user clicking the Disconnect button.
*/
 
function onclose(event)
{
    log("Closing WebSocket connection. Code: " + event.code + " Reason: " + event.reason);
    e = event;
};
 
/**
* The connect function is called when the user clicks the Connect button.
* The function sets up the event handlers for connection and message
* management.
*/
 
function connect(location, credentials)
{
    // We are not using any credentials.
    var username = "";
    var password = "";
    // create an instance of WebSocket by specifying the end-point.
    var wsf = new WebSocketFactory();
    // creates a WebSocket to establish a full-duplex connection to the target location.
    socket = wsf.createWebSocket(location);
 
    socket.onopen = function() 
    {
    // call the writeFrame function and pass it credentials
    writeFrame("CONNECT", {"login": username, "password": password});
        log("Connected to " + location + " with u/p " + username + "," + password);
    };  
 
  // Event handler listening for incoming messages.
  socket.onmessage = function(event) 
    { 
        readFragment(event); 
    };
     
  // Event handler for close events.
  socket.onclose = function(event) 
    { 
        onclose(event); 
    };
};
 
/**
* The writeFrame function is called when the connection is opened,
* and when the user clicks the Send button via the send() function.
* The writeFrame function creates the WebSocket frame and before
* writing the frame content in the buffer to the socket, 
* the buffer is flipped so that it can be read.
*/
 
function writeFrame(command, headers, body)
{
    // create a new frame buffer
    var frame = new ByteBuffer();
  
    log("Sending frame. Command: " + command + " headers: " + headerToString(headers) + " body: " + (body || ""));
    // build the command line
     
    frame.putString(command, Charset.UTF8);
    frame.put(LINEFEED_BYTE);
  
    // build the headers lines
    for (var key in headers) 
    {
        var value = headers[key];
         
        if (typeof(value) == "string") 
        {
            var header = String(value);
            frame.putString(key, Charset.UTF8);
            frame.put(COLON_BYTE);
            frame.put(SPACE_BYTE);
            frame.putString(header, Charset.UTF8);
            frame.put(LINEFEED_BYTE);
        }
      }
      
      // add "content-length" header for binary content
      if (body instanceof ByteBuffer) 
      {
            frame.putString("content-length", Charset.UTF8);
            frame.put(COLON_BYTE);
            frame.put(SPACE_BYTE);
            frame.putString(String(body.remaining()), Charset.UTF8);
            frame.put(LINEFEED_BYTE);
      }
      
        // empty line at end of headers
        frame.put(LINEFEED_BYTE);
      
        // add the body (if specified)
        switch (typeof(body)) 
        {
            case "string":
                // add as text content
                frame.putString(body, Charset.UTF8);
                break;
            case "object":
                // add as binary content
                frame.putBuffer(body);
                break;
        }
      
      // null terminator byte
      frame.put(NULL_BYTE);
      
      // flip the frame buffer
      frame.flip();
      
      // send the frame buffer
      socket.send(frame);
}   
 
/*
* The readFragment function is called by the connect() function.
* readFragment reads data fragments of the ByteBuffer that is sent
* from the server to the client.
*/
 
function readFragment(event)
{
    // initialize read buffer
    buffer = new ByteBuffer();
    var limit;
      
    // skip to the end of the buffer
    buffer.skip(buffer.remaining());
      
    // append new data to the buffer
    var data = event.data;
    var size = data.size;
    // var str = BlobUtils.asBinaryString(function() {}, data);
    // var str = BlobUtils.asString(data, 0, size);
    var cb = function(result) 
    {
        var buf = new ByteBuffer(result);
        buffer.putBuffer(buf);
        // prepare the buffer for reading
        buffer.flip();
          
        outer: 
        while (buffer.hasRemaining()) 
        {
            // initialize frame we will build from data
            var frame = { headers : {} };
              
            // Note: skip over empty line at start of frame
            // scenario can occur due to fragmentation
            // if Apache ActiveMQ STOMP end-of-frame newline
            // spills into the start of the next frame
            if (buffer.getAt(buffer.position) == LINEFEED_BYTE) 
            {
                buffer.skip(1); // linefeed
            }
      
            // mark read progress
            buffer.mark();
              
            // search for command
            var endOfCommandAt = buffer.indexOf(LINEFEED_BYTE);
             
            if (endOfCommandAt == -1) 
            {
                // There is no command, so break out of the outer while.
                buffer.reset();
                break;
            }
              
            // read command
            // Make sure we won't read beyond the command
            limit = buffer.limit;
            buffer.limit = endOfCommandAt;
            frame.command = buffer.getString(Charset.UTF8);
            buffer.limit = limit;
              
            // skip linefeed byte
            buffer.skip(1);
              
            while(true) 
            {
                var result = processData(buffer, frame);
                if (!result)
                    break outer;
                // Else, just continue.
            } // end inner while(true)
        } // end while(buffer.hasRemaining())
      
        // compact the buffer
        buffer.compact();
    };
     
    var arr = BlobUtils.asNumberArray(cb, data);
}
 
/*
* processData() is called by the readFragment() function to
* process the incoming data frames and their headers and
* then pass the frame to the corresponding handler such as
* onmessage(). 
*/
 
function processData(buffer, frame)
{
    var endOfHeaderAt = buffer.indexOf(LINEFEED_BYTE);
 
    // detect incomplete frame
    if (endOfHeaderAt == -1) 
    {
        // There are no headers; we're outta here.
        buffer.reset();
        return false;
    }
 
    // detect header or end-of-headers
    if (endOfHeaderAt > buffer.position) 
    {
        // non-empty line: header
        // Otherwise, the position would have been equal.
        limit = buffer.limit;
        buffer.limit = endOfHeaderAt;
        var header = buffer.getString(Charset.UTF8);
        buffer.limit = limit;
 
        // process header line
        var endOfName = header.search(":");
         
        // Javascript: for a Map, a["b"] = "c" is equivalent to a = { "b" : "c" }
        // So this sets { header : value } in headers Map
        frame.headers[header.slice(0, endOfName)] = header.slice(endOfName + 1);
 
        // skip linefeed byte
        buffer.skip(1);
    }
    else
    {
        // skip linefeed byte
        buffer.skip(1);
 
        // empty line: end-of-headers
        var length = Number(frame.headers['content-length']);
        var pattern = /;\scharset=/;
        var contentType = String(frame.headers['content-type'] || "");
        var contentTypeAndCharset = contentType.split(pattern);
 
        // RabbitMQ always sends content-length header, even for text payloads
        // but then also includes content-type header with value "text/plain"
         
        // ActiveMQ only sends content-length for binary payloads
        // Payload is binary if content-length header is sent, and content-type
        // header is not "text/plain" (may be undefined)
         
        // Added additional check to look for "text/plain" instead of the exact
        // match, as the content-type value can be like "text/plain; charset=UTF-8"
         
        // RabbitMQ sends content-length but no content-type for ERROR messages
        // so assume text content for ERROR messages
         
        // Therefore, 
        // if command is not ERROR, and 
        // length is a Number (i.e. was given), and 
        // the first part of the content type is NOT "text/plain"
        if (frame.command != "ERROR" && !isNaN(length) && contentTypeAndCharset[0] != "text/plain") 
        {
            // content-length specified, binary content
 
            // detect incomplete frame
            if (buffer.remaining() < length + 1) 
            {
                // The indicated length is greater than the data we have.
                // Plus, an additional char for the terminating null(?).
                buffer.reset();
                return false;
            }
 
            // extract the frame body as byte buffer
            limit = buffer.limit;
            // This sets the max we can read up to the end of our content length
            buffer.limit = buffer.position + length;
            frame.body = buffer.slice();
            // Reset this
            buffer.limit = limit;
            // Since we have our content, skip over those
            buffer.skip(length);
 
            // skip null terminator, unless buffer already consumed
            if (buffer.hasRemaining()) 
            {
                buffer.skip(1);
            }
        }
        else
        {
            // content-length not specified, text content
 
            // detect incomplete frame
            var endOfFrameAt = buffer.indexOf(NULL_BYTE);
             
            if (endOfFrameAt == -1) 
            {
                // We didn't get a complete frame.
                buffer.reset();
                return false;
            }
 
            // verify that UTF-8 charset is appropriate
            var charset = ((contentTypeAndCharset[1]) || "utf-8").toLowerCase();
 
            if (charset != "utf-8" && charset != "us-ascii") 
            {
                throw new Error("Unsupported character set: " + charset);
            }
 
            // extract the frame body as null-terminated string
            frame.body = buffer.getString(Charset.UTF8);
        }
 
        // invoke the corresponding handler
        switch (frame.command) 
        {
            case "CONNECTED":
                onopen(frame);
                break;
            case "MESSAGE":
                onmessage(frame);
                break;
            case "RECEIPT":
                onreceipt(frame);
                break;
            case "ERROR":
                onerror(frame);
                break;   
            default:
                throw new Error("Unrecognized STOMP command '" + frame.command + "'");
        }
 
        // No longer needed?
        // break;
    }
     
    return true;
}
/**
 * Disconnects from the remote STOMP server.
 */
function disconnect() 
{
    if (socket.readyState === 1) 
    {
        writeFrame("DISCONNECT", {});
    }
     
    return true;
}
 
/**
 * Sends a message to a specific destination at the remote STOMP Server.
 *
 * @param body the message body
 * @param destination the message destination
 * @param txnID the transaction ID (optional)
 */
function sendToDestination(body, destination, txnID)
{
    var headers = {};
    headers["content-type"] = "text/plain";
    var body = body || "This is a message for stompq";
    headers["content-length"] = body.length;
    send(body, destination, txnID, null,  headers);
}
 
/**
 * Sends a message to a specific destination at the remote STOMP Server.
 *
 * @param body the message body
 * @param destination the message destination
 * @param transactionId the transaction identifier
 * @param receiptId the message receipt identifier
 * @param headers the message headers
 */
function send(body, destination, transactionId, receiptId, headers)
{
    transactionId = transactionId || "";
    receiptId = receiptId || "";
    header = headers || {};
    headers["destination"] = destination;
    if (transactionId.length)
        headers["transaction"] = transactionId;
    if (receiptId.length)
        headers["receipt"] = receiptId;
    writeFrame("SEND", headers, body);
}
 
/**
 * Subscribes to receive messages delivered to a specific destination.
 *
 * @param destination the message destination
 * @param acknowledge the acknowledgment strategy
 * @param id the subscription ID
 * @param headers the subscribe headers
 */
function subscribe(destination, acknowledgement, id, headers) 
{
    acknowledgement = acknowledgement || "";
    id = id || "0";
    headers = headers || {};
    headers["destination"] = destination;
    headers["ack"] = acknowledgement;
    headers["id"] = id;
    writeFrame("SUBSCRIBE", headers);
}
 
/**
 * Unsubscribes from receiving messages for a specific destination.
 *
 * @param id the subscription ID
 * @param headers the unsubscribe headers
 */
function unsubscribe(id, headers)
{
    id = id || "0";
    headers = headers || {};
    headers["id"] = id;
    writeFrame("UNSUBSCRIBE", headers);
}
 
/**
 * Begins a new transaction.
 *
 * @param id the transaction identifier
 * @param headers the begin headers
 */
function begin(id, headers)
{
    headers = headers || {};
    headers["transaction"] = id;
    writeFrame("BEGIN", headers);
}
 
/**
 * Commits a new transaction.
 *
 * @param id the transaction identifier
 * @param headers the begin headers
 */
function commit(id, headers)
{
    headers = headers || {};
    headers["transaction"] = id;
    writeFrame("COMMIT", headers);
}
 
/**
 * Aborts a new transaction.
 *
 * @param id the transaction identifier
 * @param headers the begin headers
 */
function abort(id, headers)
{
    headers = headers || {};
    headers["transaction"] = id;
    writeFrame("ABORT", headers);
}
  
/**
 * Acknowledges a received message.
 *
 * @param messageId the message identifier
 * @param transactionId the transaction identifier
 * @param subscription the message subscriber identifier
 * @param headers the acknowledgment headers
 */
function ack(messageId, transactionId, subscription, headers)
{
    transactionId = transactionId || "";
    headers = headers || {};
    headers["message-id"] = messageId;
    if (transactionId.length)
        headers["transaction"] = transactionId;
    headers["subscription"] = subscription;
    writeFrame("ACK", headers);
}
 
/**
* The onopen handler is called when the connect handshake is completed.
*
* @param headers the connected message headers
*/
function onopen(frame) 
{
    logFrame(frame);
};
 
/**
 * The onmessage handler is called when a message is delivered to a subscribed
 * destination.
 *
 * @param headers the message headers
 * @param body the message body
 */
var onmessage = function(frame)
{
    logFrame(frame);
    // Acknowledge it.
    var msgId = frame.headers["message-id"];
    var subscription = frame.headers["subscription"];
    ack(msgId, null, subscription, null);
};
  
/**
 * The onreceipt handler is called when a message receipt is received.
 *
 * @param headers the receipt message headers
 */
var onreceipt = function(frame)
{
    logFrame(frame);
};
  
/**
 * The onerror handler is called when an error message is received.
 * @param headers the error message headers
 * @param body the error message body
 */
var onerror = function(frame)
{
    logFrame(frame);
};
 
var logFrame = function(frame)
{
    log("Received: " + frame.command);
     
    var headers = frame.headers || {};
    if (!headers)
        return;
     
    log("Headers:")
     
    log(headerToString(headers));
     
    log("Body: " + frame.body);
}   
 
/**
* Converts the header to string and returns it to the writeFrame()
* function.
*/
 
var headerToString = function(headers)
{
    str = null;
     
    for (var hdr in headers)
    {
        if (!str)
            str = "";
        else
            str = str + ", ";
         
        str = str + hdr + " : " + (headers[hdr] || "<BLANK>");
    }
     
    return str;
}
 
/**
* Create the log in the user interface webpage.
*/
 
function log(s)
{
    var p = document.createElement("p");
    p.style.wordwrap = "break-word";
    p.textContent = s;
    output.appendChild(p);
     
    var children = output.childNodes;
    while (children && children.length > 100)
        output.removeChild(children[0]);
}
 
function clearLog()
{
    var children = output.childNodes;
    while (children && children.length > 0)
        output.removeChild(children[0]);
}