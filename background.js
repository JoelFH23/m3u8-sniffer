/* eslint no-undef: "off" */
const capturedStreams = []

function addToList (streamUrl, tabId, streamType) {
  const existingTabData = capturedStreams.find(item => item.tabId === tabId)
  if (existingTabData) {
    if (existingTabData.files.length >= 10) existingTabData.files.length = 0
    if (!existingTabData.files.some(file => file.streamUrl === streamUrl)) {
      existingTabData.files.push({ streamType, streamUrl })
    }
  } else {
    capturedStreams.push({
      tabId,
      files: [{ streamType, streamUrl }]
    })
  }

  const currentTabData = capturedStreams.find(item => item.tabId === tabId)
  if (currentTabData) {
    chrome.action.setBadgeText({ text: `${currentTabData.files.length}`, tabId })
    chrome.action.setBadgeBackgroundColor({ color: 'green', tabId })
  }
}

chrome.runtime.onConnect.addListener(function (popupPort) {
  popupPort.onMessage.addListener(function ({ requestedTabId, action }) {
    if (action === 'get') {
      popupPort.postMessage(capturedStreams.filter(item => item.tabId === requestedTabId))
    } else if (action === 'clear') {
      const index = capturedStreams.findIndex(item => item.tabId === requestedTabId)
      if (index !== -1) capturedStreams[index].files = []
      chrome.action.setBadgeText({ text: '', tabId: requestedTabId })
    }
  })
})

chrome.webRequest.onCompleted.addListener(async function (requestDetails) {
  try {
    if (!/\.m3u8([?#]|$)/.test(requestDetails.url)) return

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!activeTab || activeTab.id !== requestDetails.tabId) return

    const url = new URL(requestDetails.url)
    const initiator = requestDetails.initiator || ''

    if (initiator?.includes('twitch.tv')) {
      const token = url.searchParams.get('token')
      if (token?.includes('web') && token?.includes('site')) {
        addToList(requestDetails.url, activeTab.id, 'live')
      } else if (token?.includes('vod_id')) {
        addToList(requestDetails.url, activeTab.id, 'vod')
      }
    } else if (initiator?.includes('kick.com')) {
      if (url.pathname?.includes('master')) {
        addToList(requestDetails.url, activeTab.id, 'vod')
      } else if (url.pathname.includes('video')) {
        addToList(requestDetails.url, activeTab.id, 'live')
      }
    } else if (url.pathname?.includes('master')) {
      addToList(requestDetails.url, activeTab.id, 'vod')
    }
  } catch (error) {
    console.error('Error processing request:', error)
  }
}, { urls: ['<all_urls>'] })
