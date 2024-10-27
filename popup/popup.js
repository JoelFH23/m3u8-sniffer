/* eslint no-undef: "off" */
const urlList = document.getElementById('url-list')
const port = chrome.runtime.connect({ name: 'port' })

;(async function () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab) return
  port.postMessage({ tabId: tab.id })
})()

port.onMessage.addListener(function (urls) {
  if (urls.length === 0) {
    const h3 = document.createElement('h3')
    h3.textContent = 'No files 😢'
    document.getElementsByTagName('body')[0].appendChild(h3)
    return
  }
  urls[0].files.forEach(url => {
    const listItem = document.createElement('li')
    const paragraph = document.createElement('p')
    const button = document.createElement('button')
    button.textContent = 'Copy'

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(paragraph.textContent)
        button.textContent = 'Copied!'
        button.style.backgroundColor = 'green'
        setTimeout(() => {
          button.textContent = 'Copy'
          button.style.backgroundColor = '#007BFF'
        }, 600)
      } catch (error) {
        console.error('Failed to copy: ', error)
      }
    })

    paragraph.textContent = url
    listItem.appendChild(paragraph)
    listItem.appendChild(button)
    urlList.appendChild(listItem)
  })
})
