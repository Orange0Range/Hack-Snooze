"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, addDel = false) {
  //console.debug("generateStoryMarkup");

  const hostName = story.getHostName();

  //Check if logged in, if logged in show option to add favs
  //if its a created story, include delete button
  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        ${Boolean(currentUser)? addFavBtn(currentUser, story):""}           
        ${addDel? addDelBtn(currentUser, story):""}                         
        <small class="story-user">posted by ${story.username}</small>
        
      </li>
    `);
}

// && (this.favorites.some(st => (st.storyId === story.storyId
function addFavBtn(user, story){
  //If is already in fav stories, add appropriate tag
  if(user.favorites.some(st => (st.storyId === story.storyId))){            
    return `<span class = 'fav'><small class = "favsYes">&#128150;</small></span>`
  }
  return `<span class = 'fav'><small class = "favsNo">&#128150;</small></span>`
}

$storyList.on('click', '.fav', toggleFav);

async function toggleFav(e){
  e.preventDefault();
  console.log('toggling...')
  const favID = e.target.closest('li').id                                             //Used to find story associated with fav button
  const story = storyList.stories.find( s => s.storyId === favID.toString())          //Find story if in all stories list
  const favStory = currentUser.favorites.find(s => s.storyId === favID.toString())    //Find story if in favs story list

  if($(e.target).hasClass('favsNo')){   
    console.debug('add fav')
    $(e.target).toggleClass('favsNo favsYes')
    await currentUser.addFavorite(story);         //Add story to fav
  }else{
    console.log('remove fav')
    $(e.target).toggleClass('favsNo favsYes')
    await currentUser.removeFavorite(favStory);  //Remove story from fav
  }
  hidePageComponents();
  putStoriesOnPage();
}

function addDelBtn(user, story){
  return `<small class = "delBtn">&#128169;</small>`
}

$storyList.on('click', '.delBtn', deleteStory)
async function deleteStory(e){
  e.preventDefault();
  console.log('deleting....')
  const ownID = e.target.closest('li').id                                           //Used to find story associated with delete button
  const story = currentUser.ownStories.find( s => s.storyId === ownID.toString())   //Find story if in all stories list
  const t = currentUser.loginToken;
  
  const response = await axios({
    url: `${BASE_URL}/stories/${story.storyId}`,
    method: "DELETE",
    data: {'token':t},
  })
  currentUser.ownStories = currentUser.ownStories.filter(own => own.storyId !== story.storyId);       //Remove created story from ownstory list

  hidePageComponents();
  putStoriesOnPage();
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

async function putStoriesOnPage() {
  console.debug("putStoriesOnPage");
  storyList = await StoryList.getStories();
  $newStory.hide();
  $headings.hide();
  $allStoriesList.empty();
  $createdStoriesList.empty();
  $favoriteStoriesList.empty();
  

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
  //If the user is logged in, show fav and created stories
  if(currentUser){
    $headings.show();
    console.debug("Putting fav stories on page")
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoriteStoriesList.append($story);
    }
    console.debug("Putting user stories on page")
    for (let story of currentUser.ownStories) {
      const $story = generateStoryMarkup(story, true);
      $createdStoriesList.append($story);
    }
  }
  $favoriteStoriesList.show();
  $createdStoriesList.show();
  
}

async function submitStory(e){
  console.debug('Submit Story')
  e.preventDefault();
  const newTitle = $("#newStory-title");
  const newURL = $("#newStory-url");
  const newAuthor = $("#newStory-author");
  if(!currentUser){                       //Can't submit if not logged in
    alert('Not Logged In')
  }else{
    if(newTitle.val() !== "" && newURL.val() !== "" && newAuthor.val() !== "")      //No empty fields allowed when submitting
    {
      console.log('submitting')
      const res_Story = await storyList.addStory(currentUser, {'author':newAuthor.val(), 'title':newTitle.val(), 'url':newURL.val()});
      currentUser.ownStories.push(res_Story);
      newTitle.val("");
      newURL.val("");
      newAuthor.val("");
    }  
  }
}
$newStory.on('submit', submitStory);

// name "testName"
// password "password"
// username "testeUsername"