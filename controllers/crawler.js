const cheerio = require('cheerio');
const fetch = require('node-fetch');
const urlParser = require('url');

const seenUrls = {}
var numberOfAdvertsFound = [0,0,0];
var advertsUrl = [];
const getUrl = (link, host, protocol) => {
  if (link.includes("http")) {
    return link;
  } else if (link.startsWith("/")) {
    return `${protocol}//${host}${link}`;
  } else {
    return `${protocol}//${host}/${link}`;
  }
};


const crawl = async ({ url, ignore, websiteIndex, location, animalType }) => {
  if (seenUrls[url] || numberOfAdvertsFound[websiteIndex] >= 1) {
  	return;}

  if(url.includes(animalType) && url.includes(location)){
   numberOfAdvertsFound[websiteIndex]++;
   await advertsUrl.push(url);

  	console.log("crawling", url);
  }
    console.log("crawling", url);
  seenUrls[url] = true;
  const { host, protocol } = urlParser.parse(url);

   let response;
  try{
    response =  await fetch(url)
	}
catch(err){
	console.log(err);
}

  const html = await response.text();
  const $ = cheerio.load(html);
  const links = $("a")
    .map((i, link) => link.attribs.href)
    .get();




  links
    .filter((link) => link.includes(host) && !link.includes(ignore))
    .forEach((link) => {
      crawl({
        url: getUrl(link, host, protocol),
        ignore,
        websiteIndex: websiteIndex,
        location: location,
        animalType: animalType
      });
    });
};


const crawlMultipleSites = async (req, res) => {
  console.log(req.body);
try{
await crawl({
   url: `https://www.animalutul.ro/anunturi/animale/${req.body.animalType}`,
   websiteIndex: '0',
   location: req.body.location.toString(),
   animalType: req.body.animalType.toString()
}
);

await crawl({
  url:`https://www.publi24.ro/anunturi/animale/${req.body.animalType}`,
  websiteIndex: '1',
   location: req.body.location.toString(),
   animalType: req.body.animalType.toString()
})
}
catch(err){
  res.status(400).json('could not crawl');
}

setTimeout(() => res.json(advertsUrl), 3000);
}
module.exports = {
  crawlMultipleSites: crawlMultipleSites
}