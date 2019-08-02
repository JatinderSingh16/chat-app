//io() for conect file with socket server
const socket = io()

const $messageForm = document.querySelector('#message-box') 
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $message = document.querySelector('#message')
const $sidebar = document.querySelector('#sidebar')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


const autoscroll = () => {
    // New message element
    const $newMessage = $message.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $message.offsetHeight

    // Height of messages container
    const containerHeight = $message.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $message.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight
    }
}

//Get values from query string 

const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

//Send message socket
socket.on('message',(message) => {
    
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('LT')
     })
    $message.insertAdjacentHTML('beforeEnd',html)
    autoscroll()
})

//send Loaction socket
socket.on('locationMessage',(message) => {
    
    const html = Mustache.render(locationTemplate,{
        username:message.username,
        url : message.url,
        createdAt : moment(message.createdAt).format('LT')
     })

    $message.insertAdjacentHTML('beforeEnd',html)   
    autoscroll()
})

//Sidebar join and left  users lift in room

socket.on('roomData',({room,users}) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
     })
     $sidebar.innerHTML=""
    $sidebar.insertAdjacentHTML('beforeEnd',html)
    
})


$messageForm.addEventListener('submit',(e) => {
     e.preventDefault()
   
     $messageFormButton.setAttribute('disabled','disabled')
    const message = $messageFormInput.value

    socket.emit('sendMessage',message,(error) => {

        if(error){
            console.log(error)
        }
      console.log('Message Delivered')   
      $messageFormButton.removeAttribute('disabled')
      $messageFormInput.value=''
      $messageFormInput.focus()
    })

})

$sendLocationButton.addEventListener('click',() => {

    if(!navigator.geolocation){
        console.log('Geolocation not supported by your browser')
    }
  $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=> {

        socket.emit('sendLocation',{
          latitude :position.coords.latitude,
          longitude :position.coords.longitude,
        },() => {
            //for callback
            console.log('Location Shared')
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})


socket.emit('join',{username, room},(error)=>{

    if(error){
        alert(error)
        location.href = "/"
    }
})
