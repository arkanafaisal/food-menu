const template = document.getElementById('template-node')



const essentialData = {}
mainFunction()

async function mainFunction(){
  initiateEssentialData()

  const dataUrl = "https://docs.google.com/spreadsheets/d/1HnxPabYY0sNdeSYl8dzEEHXCg-9f0Royk3DK0s_uDWo/export?format=csv" + "&_=" + Date.now()
  let data, errorMessage
  try{
    const response = await fetch(dataUrl)
    data = await response.text()
    data = Papa.parse(data).data
  } catch(error){
    errorMessage = error.message
  }

  document.getElementById('loading-indicator').classList.add('hidden')
  if(errorMessage){
    const errorNode = template.content.getElementById('error-menu').cloneNode(true)
    errorNode.children[0].textContent = errorMessage
    errorNode.children[1].onclick = ()=>{
      document.getElementById('loading-indicator').classList.remove('hidden')
      document.getElementById('error-menu').remove()
      mainFunction()
    }
    menuList.appendChild(errorNode)
    return
  }


  let dataCleaned = []
  for(let i=0; i<data.length; i++){
    const current = data[i]
    if(i === 1){
      essentialData.company = current[0]
      essentialData.slogan = current[1]
      essentialData.prefilledGform = current[2]
      essentialData.contactPerson = current[3].split(',').map(val => val.trim().replace(/\)/g, '').split('('))
      essentialData.noticeText = current[4]

      initiateEssentialData(essentialData)
      continue
    }
    if(i < 4){continue}

    let dataObject = {}
    dataObject.name = current[0]
    dataObject.stock = current[1]
    dataObject.image = '' 
    let imgLinkStartId = current[2].indexOf('/d/')
    if(imgLinkStartId !== -1){
      let imgLinkId = current[2].slice(imgLinkStartId + 3, current[2].indexOf('/view'))
      let imgUrl = 'https://drive.google.com/thumbnail?id=' + imgLinkId
      dataObject.image = imgUrl
    }
    dataObject.price = current[3].split(',').map(val => val.trim())

    let extras = []
    for(j=4; j<current.length; j++){
      if(current[j] === '') continue

      let extra = current[j].split('=')
      dataObject[extra[0].trim()] = extra[1].split('/').map(val => val.trim())
    }

    dataCleaned.push(dataObject)
  }
    dataCleaned.sort((a,b) => {
      if(a.stock === 'habis' && b.stock === 'tersedia'){return 1}
      if(a.stock === 'tersedia' && b.stock === 'habis'){return -1}
      return 0
    })

  initiateMainData(dataCleaned)
}

function initiateEssentialData(data){
  if(data){
    localStorage.setItem('company', data.company)
    localStorage.setItem('slogan', data.slogan)
    localStorage.setItem('noticeText', data.noticeText)
  }

  document.getElementById('company').textContent = localStorage.getItem('company') || 'YourFood'
  document.getElementById('hero-text').textContent = localStorage.getItem('slogan') || 'Nanti Makan Apa? Pesan Sekarang!'

  document.getElementById('notice-text').textContent = localStorage.getItem('noticeText')
  if(localStorage.getItem('noticeText') && localStorage.getItem('noticeText').trim() !== ''){
    document.getElementById('notice-text').parentElement.classList.remove('hidden')
  }

  if(data && data.contactPerson[0] !== ''){
    data.contactPerson.forEach(item => {
      const newNode = template.content.getElementById('contact-node').cloneNode(true)
      newNode.children[0].children[1].textContent = item[0]
      if(!item[1] || item[1].trim() === '') return 
      newNode.children[0].onclick = () => {
        const linkWa = 'https://wa.me/' + item[1] + '?text=' + 'permisi%20kak%20' + item[0] + '...%0A'
        window.open(linkWa, '_blank')
      }

     document.getElementById('contact-list').appendChild(newNode)
    })
  }
}


const menuList = document.getElementById("menu-list")
const menuListNode = template.content.getElementById("menu-list-node")
let menuListNodeWidth = (menuList.offsetWidth * 0.7) + 'px'

function initiateMainData(data){
  const fragment = document.createDocumentFragment()
  data.forEach(menuData => {
    if(menuData.stock === 'sembunyikan') return
    const newNode = menuListNode.cloneNode(true)
    newNode.onclick = () => {changeMenuSelected(newNode, event)}
    newNode.classList.remove('hidden')

    const nodeChildren = newNode.children
    nodeChildren[0].src = menuData.image
    nodeChildren[0].alt = 'gambar ' + menuData.name
    nodeChildren[0].style.maxWidth = menuListNodeWidth
    nodeChildren[1].textContent = menuData.name
    newNode.dataset['name'] = menuData.name

    const detailsChildren = newNode.querySelector('#detail-text').children
    detailsChildren[1].textContent = "status: " + menuData.stock
    detailsChildren[0].textContent = "harga: " + menuData.price[0]
    newNode.dataset['price'] = menuData.price[0]

    if(menuData.stock === 'habis'){
      newNode.classList.add('opacity-50')
      const button = nodeChildren[2].children[1]
      button.classList.remove('bg-green-500')
      button.classList.add('bg-green-500/30')
      button.onclick = null
    }

    const keys = Object.keys(menuData)
    for(let i=4; i<keys.length; i++){
      if(!menuData[keys[i]][1] || (menuData[keys[i]][1] && menuData[keys[i]][1].trim() === '')){
        const newDetail = template.content.getElementById('read-menu-detail').cloneNode()
        newDetail.classList.remove('hidden')
        newDetail.textContent = keys[i] + ': ' + menuData[keys[i]][0]
        
        nodeChildren[2].children[0].appendChild(newDetail)
        continue
      }
      
      
      const newDetail = template.content.getElementById('select-menu-detail').cloneNode(true)
      newDetail.classList.remove('hidden')

      newDetail.children[0].textContent = keys[i] + ': '
      newDetailBtnContainer = newDetail.children[1]
      
      if(!newDetail.dataset.priceRef) newDetail.dataset.priceRef = i

      for(let j=0; j<menuData[keys[i]].length; j++){
        const newSelectableDetail = newDetailBtnContainer.children[0].cloneNode()
        newSelectableDetail.classList.remove('hidden')

        newSelectableDetail.textContent = menuData[keys[i]][j]
        newSelectableDetail.id = newNode.dataset['name'].replace(/\s+/g, "") + '-item-detail-' + keys[i] + '-' + j
        newSelectableDetail.dataset.selfIndex = j
        newDetailBtnContainer.appendChild(newSelectableDetail)

        newSelectableDetail.onclick = () => {
          let oldSelected = newSelectableDetail.parentElement.querySelector('.selected')
          oldSelected.classList.remove('selected', 'bg-blue-500/50')

          newSelectableDetail.classList.add('selected', 'bg-blue-500/50')
          newNode.dataset['extra' + i] = newSelectableDetail.textContent
          
          
          let selfIndex = parseInt(newSelectableDetail.dataset.selfIndex)
          //alert(menuData.price[newSelectableDetail.dataset.selfIndex])
          if(i === parseInt(newDetail.dataset.priceRef) && menuData.price.length > 1 && menuData.price.length > selfIndex){
            detailsChildren[0].textContent = "harga: " + menuData.price[selfIndex]
            newNode.dataset['price'] = menuData.price[newSelectableDetail.dataset.selfIndex]
            detailsChildren[0].classList.add('text-red-500')
            setTimeout(() => {detailsChildren[0].classList.remove('text-red-500')}, 300)
          }
        }
      }
      newDetailBtnContainer.children[1].classList.add('selected', 'bg-blue-500/50')
      newNode.dataset['extra' + i] = menuData[keys[i]][0]

      nodeChildren[2].children[0].appendChild(newDetail)
    }

    newNode.dataset.extraLength = keys.length
    fragment.appendChild(newNode)
  })

  menuList.appendChild(fragment)
  menuList.children[0].classList.add('border-3', 'border-[#FFC107]', 'menu-selected')
  const firstListDetail = menuList.children[0].children[2]
  firstListDetail.style.maxHeight = firstListDetail.scrollHeight + 100 + "px"
}



function changeMenuSelected(newSelected, event) {
  oldSelected = document.querySelector(".menu-selected")
  if(oldSelected){
    oldSelected.classList.remove('border-3', 'border-[#FFC107]', 'menu-selected')
    oldSelected.children[2].style.maxHeight = 0
  }
  if(event.target.tagName !== 'BUTTON' && oldSelected === newSelected){return}

  newSelected.classList.add('border-3', 'border-[#FFC107]', 'menu-selected')
  const detail = newSelected.children[2]
  detail.style.maxHeight = detail.scrollHeight + "px"
}


const cartItemList = document.getElementById("cart-item-list")
const cartItemListNode = template.content.getElementById('cart-item-list-node')
const cartNotif = document.getElementById("cart-notification")
const totalPrice = document.getElementById('total-price')
function addOrder(element){
  const parent = element.parentElement
  const rootParent = parent.parentElement
  const itemDetail = parent.children[0].children

  const newItem = cartItemListNode.cloneNode(true)
  newItem.classList.remove('hidden')
  const children = newItem.children[0].children

  let itemSelectedData = parent.id + "-" + itemDetail[0].textContent.split(' ')[1] + "-"
  children[1].textContent = rootParent.dataset['name']
  children[2].textContent = rootParent.dataset['price']
  totalPrice.textContent = parseInt(totalPrice.textContent) + parseInt(rootParent.dataset['price']) + 'k'

  const extraDetailNode = children[3]
  for(i=4;i<rootParent.dataset.extraLength;i++){
    const newDetail = extraDetailNode.cloneNode()
    newDetail.classList.remove('hidden')


    newDetail.textContent = rootParent.dataset['extra' + i]
    itemSelectedData += (rootParent.dataset['extra' + i] + '-')

    newItem.children[0].appendChild(newDetail)
  }

  const existItemList = document.getElementById(itemSelectedData)
  if(existItemList){
    existItemList.children[0].children[0].textContent = parseInt(existItemList.dataset.orderCount) + 1
    existItemList.dataset.orderCount = parseInt(existItemList.dataset.orderCount) + 1

    cartNotif.parentElement.classList.remove('hidden')
    cartNotif.textContent = (parseInt(cartNotif.textContent) + 1) + ' baru!'
    return
  }  

  newItem.id = itemSelectedData
  newItem.dataset.orderCount = 1
  cartItemList.appendChild(newItem)

  const hr = document.createElement('hr')
  cartItemList.appendChild(hr)

  cartNotif.parentElement.classList.remove('hidden')
  cartNotif.textContent = (parseInt(cartNotif.textContent) + 1) + ' baru!'
}

function removeItem(el){
  const parent = el.parentElement
  removedPrice = parseInt(parent.children[0].children[2].textContent)
  totalPrice.textContent = parseInt(totalPrice.textContent) - removedPrice + 'k'

  parent.dataset.orderCount = parseInt(parent.dataset.orderCount) -1
  if(parseInt(parent.dataset.orderCount) === 0){
    parent.nextElementSibling.remove()
    parent.remove()
    return
  }

  parent.children[0].children[0].textContent = parent.dataset.orderCount
}

function makeOrder(){
  const allOrderNode = cartItemList.children
  if(allOrderNode.length === 0){return}

  let allOrderData = []
  let allPriceData = []

  for(i=0; i<allOrderNode.length; i+=2){
    current = allOrderNode[i]
    allOrderData.push(
      (current.dataset.orderCount)
      + ' ' + (current.children[0].children[1].textContent)
      + ' ' + (current.id.split('-').slice(2)).join(' ')
    )
    allPriceData.push(current.children[0].children[2].textContent)
  }

  allOrderData = allOrderData.join('\n')


  let newPrefilledGform = ''
  const startIndex = essentialData.prefilledGform.indexOf("entry.")

  const firstEntryStartIndex = essentialData.prefilledGform.indexOf('=', startIndex)
  const firstEntryEndIndex = essentialData.prefilledGform.indexOf('&entry', startIndex)
  const secondEntryStartIndex = essentialData.prefilledGform.indexOf('=', firstEntryEndIndex)

  newPrefilledGform = essentialData.prefilledGform.slice(0, secondEntryStartIndex+1) + totalPrice.textContent // + data.prefilledGform.slice(secondEntryEndIndex, data.prefilledGform.length)
  newPrefilledGform = newPrefilledGform.slice(0, firstEntryStartIndex+1) + encodeURIComponent(allOrderData)  + newPrefilledGform.slice(firstEntryEndIndex, essentialData.prefilledGform.length)

  window.location.href = newPrefilledGform
}


const shoppingCart = document.getElementById("shopping-cart")
const main = document.getElementById("page-main")
const footer = document.getElementById('page-footer')
function toggleCart(){
  if(main.classList.contains('hidden')){
    main.classList.remove("hidden")
    footer.classList.remove('hidden')
    shoppingCart.classList.add("hidden")
    menuList.scrollIntoView()
    window.scrollBy(0,-120)
    return
  }

  main.classList.add("hidden")
  footer.classList.add('hidden')
  shoppingCart.classList.remove("hidden")
  cartNotif.parentElement.classList.add('hidden')
  cartNotif.textContent = 0
}

