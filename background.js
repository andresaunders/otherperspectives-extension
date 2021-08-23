
 chrome.tabs.onUpdated.addListener((current_tab_id, change_info, tab) =>{

    if(change_info.status == 'complete' && tab.url.startsWith('http')){

        if(tab.url.includes('app.otherperspectives.io')){

            chrome.scripting.executeScript({

                target: {tabId: current_tab_id},

                files: ['./op-main.js']
            })
        }
    }    

 })
