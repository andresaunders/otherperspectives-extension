
if(!document.getElementById('otherperspectives-extension-marker')){

	let marker = document.createElement('span');

	marker.id = 'otherperspectives-extension-marker';

	document.body.appendChild(marker);

	callScript();
	
	function callScript(){
		
		let log = console.log;
	
		let log_string = '';
	
		console.log = function(args){
	
			log_string += args + '\n';
	
			chrome.runtime.sendMessage({log: log_string});
		}

		let progress = 0; // 0 - 100
	
		//GET POST HTML CONTAINER --------------------------------------------
		async function getData(){
	
			console.log('getData');
	
			let csvHeader = "profile, source, date, engagement,engagement_rate,likes,comments,shares,post_text\n";
	
			let csv = '';
			
			let posts = Array.from(document.querySelectorAll('div[fill-height]'));

			let num_posts = posts.length;
			
			let dataPromise = new Promise((returnData, reject)=>{

				for(let postIndex in posts){
	
					console.log(`postIndex: ${postIndex}`);
					
					getPost(posts[postIndex]).then((postCSV)=>{

						csv += postCSV + '\n';

							if(postIndex == posts.length - 1){
					
							returnData(csvHeader + csv);
						}
					}).catch(error => console.log(`error: ${error}`));
					
				}
			})
				
			return dataPromise;
		}
		//GET POST
		function getPost(post){
	
			console.log('getPost');
	
			let retImages, retText, retVideos;
			
	
			let imagesPromise = getImages(post);
			
			return imagesPromise.then((returnedImages)=>{
				retImages = returnedImages;
				/*console.log('retImages: ', retImages);
				console.log('retImages split: ', retImages.split(','));*/
				return getVideos(post); 
				
			}).then((returnedVideos)=>{
				retVideos = returnedVideos;
			/*console.log('retVideos: ', retVideos);
				console.log('retVideos split: ', retVideos.split(','));*/
				return getText(post);
			}).
			then((returnedText)=>{
				return getInfluencerProfile(post) + ',' + postSource(post) + ',' + getDate(post) + ',' + getEngagement(post) + "," + getRate(post) + "," + getLikes(post) + "," + getComments(post) + "," + getShares(post) + "," + returnedText + "," + retImages + ',' + retVideos;
			}).catch(error => console.log('error: ', error));
			
		}
	
		// GET POST DATA
	
		function numText(text){
		let num = 0, regex = /\d+/;
		if(text.includes('.')){
			regex = /\d+.\d+/; 
		}
		
		if(text.includes(',')){
			text = format(text); //text.replace(/,/g, '');
		}
		
		if(text.match(regex)) {
			num = parseFloat(text.match(regex)[0]);
			if(text.includes('K')){
			num *= 1000;
			}
			else if(text.includes('M')){
				num *= 1000000;
			}
			
		}
		return num;
		
		}
	
		function format(str){
			str = str.replace(/,/g, '');
			str = str.replace(/\n/g, ' '); 
			
			//let regex = new RegExp(`[${chars}]`,'g')
			return str;
		}
	
		function postSource(post){
	
			console.log('postSource');
	
			if(post.querySelector('a').href.includes('facebook')){
				return 'fb';
			}
			else if(post.querySelector('a').href.includes('instagram')){
				return 'ig';
			}
			return 'unknown';
			
		}
	
		function getMetric(post, class_selector){

			let selector = 'i[class*=' + class_selector + ']'

			let metric = post.querySelector(selector);

			if(metric){

				return numText(metric.parentNode.innerText);
			}

			return 0;
		}
	
		function getInfluencerProfile(post){

			let profile = post.querySelector('a'); //profile should be first link in post

			if(profile){

				return profile.href;
			}
		}
	
		function getDate(post){//get date from post
	
			if(!post){

				return 'n/a';
			}
			
			let date = post.querySelector('i[class*=timer]');
			
			if(!date || !date.parentNode){

				return 'n/a';
			}
			
			date = date.parentNode.innerText;
	
			let regex = /([\w\d\s,:]+)\-?/;//date consists of letters, numbers, spaces, :, and ',' -> exclude '- and after'
			
			let match = date.match(regex);
			
			date = match[1];
			
			return format(date); //date.replace(/,/g, '');
		}
	
	
		function getEngagement(post){

			return getMetric(post, 'chart');
		}
	
		function getRate(post){

			return getMetric(post, 'pulse');
		}
	
		function getLikes(post){

			let selector = '';
			
			if(postSource(post) == 'fb'){

				selector = 'thumb';
			}
			else {//source = 'ig'

				selector = 'heart';
			}

			return getMetric(post, selector);
		}
	
		function getComments(post){

			return getMetric(post, 'comment');
		}
	
		function getShares(post){

			if(postSource(post) == 'ig') {

				return 'n/a';
			}

			return getMetric(post, 'share');
		}
	
		async function clickCarousel(){
	
			console.log('clickcarousel');
			
			let clickPromise = new Promise((doneClicking, reject) => {
	
					let btns = Array.from(document.querySelectorAll('button[class*=carousel]'))
	
					console.log(`btns: ${btns.length}`);

					if(btns.length == 0 || !btns){
	
						doneClicking(true);
	
						return clickPromise;
					}
	
					let clickInterval = .15;
	
					let btnIndex = 0;

					let elapsed_time = 0;

					let click_interval = 150;

					function clickFunction(time){

						elapsed_time += time;

						if(elapsed_time >= click_interval){

							progress = Math.floor(100 * (btnIndex/btns.length));

							sendProgress(progress);

							btns[btnIndex].click();

							btnIndex++;

							elapsed_time = 0;
						}

						if(btnIndex < btns.length-1){

							requestAnimationFrame(clickFunction);
						}
						else{

							doneClicking(true);
						}
					}

					requestAnimationFrame(clickFunction);
			});
	
			return clickPromise;
		}
	
		function clickCarouselPost(post){
	
			let btns = Array.from(post.querySelectorAll('button[class*=carousel]'))
	
			for(btnIndex in btns){
	
				btns[btnIndex].click();
			}
		}
		//GET POST TEXT AND IMAGES
		async function getImages(post){
	
			console.log('getImages');
	
			let urls = '';

			let numClicks = 0;

			let numButtons = 0;

			let images;
	
			images = Array.from(post.querySelectorAll('img[src]')).map(x => x.src);
	
			if(images.length == 0){
	
				return 'images: n/a';
			}
		
			images = combineURLS(images, 'image');
			
			return images;
		}
	
		async function getVideos(post){
	
			console.log('getVideos');
	
			let videos;
		
			// DEBUG console.log('getVideos post value: ', post);
			videos = Array.from(post.querySelectorAll('video source')).map(x => x.src);
	
			if(videos.length == 0){
	
				return 'videos: n/a';
			}
			// DEBUG console.log('numVideos: ', videos.length);
			videos = combineURLS(videos, 'video');
			
			return videos;
		}
	
		function combineURLS(URLS, dataType){
	
			let combo = '';
	
			for(let URL of URLS){
	
				if(URL != '') {
	
					combo += dataType + ":," + URL + ',';
				}
			}
			if(combo.includes(',')){
	
				combo = combo.substring(0, combo.length-1);
			}
	
			return combo;
		}
	
		function getText(post){
	
			console.log('getText');
	
			let readMoreLinks = post.querySelectorAll('a#readmore');
	
			let waitForText = 50;
	
			for(let link of readMoreLinks){
	
				if(link.innerText.toLowerCase().includes('more')){
	
					link.click();
	
					break;
				}
			}
			
			let textPromise = new Promise((returnText, reject)=>{
	
				setTimeout(()=>{
	
					let txt = post.querySelector('p');
	
					if(txt){
	
						returnText(format(txt.innerText));
					}
					else{
	
						returnText('n/a');
					}
					
				}, waitForText);
			})
			
			return textPromise.then((promisedText)=>{
	
				return promisedText;
			})
		}
	
	
		//DOWNLOAD CSV FILE ON BUTTON CLICK -------------------------------------------
	
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	
	
			if(message.action == 'download-csv-clicked'){
	
				downloadOnClick();
			}
			else if(message.action == 'send log'){

				chrome.runtime.sendMessage({log: log_string});
			}
			else if(message.action = 'send progress'){

				let test_progress = Math.floor(100 * Math.random());

				sendProgress(progress);
			}
	
			return true;
		})

		function sendProgress(progress){

			chrome.runtime.sendMessage({progress: progress});
		}
	
	
		function downloadOnClick(){
	
			console.log('downloadOnClick')
	
			scrollToEnd().then((scrolledToEnd)=>{
	
				return clickCarousel();
	
			}).then((doneClicking) =>{
	
				downloadData();
	
			}).catch((error) =>{
	
					console.log(`error: ${error}`);
			})
	
		}
	
		function main(){
	
			let hide = false;

			if(hide){
	
				hidePosts();
			}
	
			console.log('in op main')
		}
	
		//downloadToFile function
		const downloadToFile = (content, filename, contentType) => {
	
			const a = document.createElement('a');
	
			const file = new Blob([content], {type: contentType});
	
			a.href= URL.createObjectURL(file);
	
			a.download = filename;
	
			a.click();
	
			URL.revokeObjectURL(a.href);
		};
	
	
		function downloadPost(){
	
			getPost(document.querySelector('div[fill-height]')).then((postCSV)=>{
	
				downloadToFile(postCSV, 'my-new-file.csv', 'text/plain');
	
			}).catch(error => console.log('error: ', error))
		}
	
		function downloadData(){
	
			console.log('download data')
	
			let d = getData();
			//DEBUG console.log('data: ', d);
			d.then((data)=>{

				progress = 100;

				sendProgress(progress);
	
				downloadToFile(data, 'other-perspectives.csv', 'text/plain');
	
			}).catch(error => console.log(`error: ${error}`))
		}
	
		//SCROLL PAGE TO LAST POST ELEMENT UNTIL NO MORE POSTS ON PAGE
		function scrollToEnd(){
			//get last post on page, and bring into view
			let infinite = true;

			let numSeconds = 1;

			let getLastInterval = numSeconds*1000;

			var getLastID;
	
			let iterations = 0;

			progress = 'Loading...';

			sendProgress(progress)
			
			let scrollPromise = new Promise((doneScrolling, reject)=>{
	
				getLastID = setInterval(() => {
	
					let infinite_container = document.querySelector('div.infinite-loading-container');
	
					if(infinite_container && infinite_container.innerText.toLowerCase().includes('no more data')){
	
						console.log(`done scrolling - elapsed time:  ${iterations * getLastInterval}`);
						
						clearInterval(getLastID);
	
						doneScrolling(true);
					}
					else {
	
						let last_child = document.querySelector('div[fill-height]:last-child');
						
						if(last_child){
	
							last_child.scrollIntoView();
						}
					}
	
					iterations++;
	
				}, getLastInterval);
			});
			
			return scrollPromise;
		}
	
		function hidePosts() {
	
			images = document.querySelectorAll('img');

			images.forEach(i => {i.style.display = 'none';});

			videos = document.querySelectorAll('video');

			videos.forEach(v => v.style.display = 'none');
		}
	
		main()
	
		/*

		Functionality
	
		downloadOnClick
			scrollToEnd ->
			clickCarousel -> 
			downloadData 
				getData
					getPost
						getImages ->
						getVideos ->
						getText ->
						getInfluencerProfile
						postSource
						getDate
						getEngagement
						getRate
						getLikes
						getComments
						getShares
	
		*/
	}
}

