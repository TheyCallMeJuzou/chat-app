// CLIENT SIDE
const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// Options
//const {username, room} = Qs.parse((location.search), { ignoreQueryPrefix: true})

const username = location.search.substring(1).split('&')[0].split('=')[1];
const room = location.search.substring(1).split('&')[1].split('=')[1];

const autoscroll = () =>{
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){ //make sure we were at bottom before last message was added
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('locationMessage', (message)=>{
    console.log(message)
    const html = Mustache.render(locationMessageTemplate,{
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('H:mm')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('message', (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm')
    })
    $messages.insertAdjacentHTML('beforeend',html) // adds into messages div
    autoscroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')
    //disable


    const message = e.target.elements.message.value //get our input through event listener
    socket.emit('sendMessage',message, (error) =>{ 
       // enable

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value= ''
        $messageFormInput.focus()

        if(error){
            return alert(error)
        }

        console.log('Message delivered!')
    }) // runs when event is aknowledged
})

$sendLocationButton.addEventListener('click',() => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
 
        socket.emit('sendLocation',{
            lat: position.coords.latitude,
            long: position.coords.longitude
        },(error)=>{
            if(error){
                return console.log(error)
            }
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })

})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})












