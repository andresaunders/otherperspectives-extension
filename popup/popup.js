
let show_log = false; 

function main(){

    console.log('popup js');

    let dl_button = document.getElementById('download-csv');

    dl_button.addEventListener('click', ()=>{
        
        let dl_message = {action: 'download-csv-clicked'};

        getCurrentTab().then(tab =>{

            chrome.tabs.sendMessage(tab.id, dl_message)

            console.log('popup js sent message: ', dl_message, ', tab: ', tab)
        })
    })

    let get_log_button = document.getElementById('get-log');

    if(!show_log){

        get_log_button.style.display = 'none';

        document.getElementById('console').style.display = 'none';
    }

    get_log_button.addEventListener('click', () => {

        getLog();
    })

    let progress_bar = document.getElementById('get-progress');

    progress_bar.addEventListener('click', () => {

        getProgress();
    })

    setupListeners();
}

function setupListeners(){

    chrome.runtime.onMessage.addListener(

        function(request, sender, sendResponse) {
        
            console.log(request);

            console.log(sender);

            if(request.hasOwnProperty('log')){

                if(show_log) {

                    document.getElementById('console').textContent = request.log
                }
            }
            else if(request.hasOwnProperty('progress')){

                let progress = request.progress;

                updateProgressBar(progress);
            }
        }
    );
}

function updateProgressBar(progress){

    let max_progress_width = 240;

    let progress_bar = document.getElementById('progress-bar');

    let container = document.getElementById('progress-bar-container')
    
    container.style.display = 'block'

    if(typeof progress == 'number'){

        progress_bar.style.width = `${(progress/100) * max_progress_width}px`;

        if(progress >= 5){

            progress_bar.textContent = progress;
        }
        else{

            progress_bar.textContent = '';
        }
    }
    else if(typeof progress == 'string'){

        progress_bar.style.width = `${max_progress_width}px`;

        progress_bar.textContent = progress;
    }


    console.log('progress: ', progress);
}

function getLog(){

    let message = {action: 'send log'}

    getCurrentTab().then(tab =>{

        chrome.tabs.sendMessage(tab.id, message)

        console.log('popup js sent message: ', message, ', tab: ', tab)
    })
}

function getProgress(){

    let message = {action: 'send progress'};

    getCurrentTab().then(tab => {

        chrome.tabs.sendMessage(tab.id, message);

    })

    console.log('get progress');
}

async function getCurrentTab() {

    let queryOptions = { active: true, currentWindow: true };

    let [tab] = await chrome.tabs.query(queryOptions);

    return tab;
}

main();