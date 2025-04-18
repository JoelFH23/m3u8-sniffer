/* eslint no-undef: "off" */
const urlListElement = document.getElementById('url-list')
const backgroundPort = chrome.runtime.connect({ name: 'popupPort' })
const clearBtn = document.getElementById('clear-btn')

let currentTabId = null

;(async function () {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!activeTab) return
  currentTabId = activeTab.id
  backgroundPort.postMessage({ action: 'get', requestedTabId: activeTab.id })
})()

clearBtn.addEventListener('click', function () {
  urlListElement.innerHTML = ''
  backgroundPort.postMessage({ action: 'clear', requestedTabId: currentTabId })
  clearBtn.disabled = true
})

backgroundPort.onMessage.addListener(function (tabStreams) {
  if (tabStreams.length === 0) {
    const h3 = document.createElement('h3')
    h3.textContent = 'No files 😢'
    document.getElementsByTagName('body')[0].appendChild(h3)
    return
  }
  clearBtn.disabled = false

  tabStreams[0].files.forEach(({ streamType, streamUrl }) => {
    const listItem = document.createElement('li')
    const paragraph = document.createElement('p')
    const badge = document.createElement('span')
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

    paragraph.textContent = streamUrl
    badge.textContent = streamType.toUpperCase()
    badge.className = `badge ${streamType}`
    listItem.appendChild(paragraph)
    listItem.appendChild(badge)
    listItem.appendChild(button)
    urlListElement.appendChild(listItem)
  })
})
