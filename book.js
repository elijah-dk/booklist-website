let bookStorageObjArr = []
 
async function fetchData() {

  try {
    bookStorageObjArr = [] // this will clear it every time a new search pops up
    const bookSearch = document.getElementById("bookSearch").value.toLowerCase();
    const searchSplit = bookSearch.split(" ")
    const response = await fetch(`https://openlibrary.org/search.json?q=${searchSplit.join("+")}&limit=10`)
    
    if (!response.ok) {
      throw new Error("couldn't find it :(")
    }

    const data = await response.json();
    console.log(data)
    return data
  } catch (error) {
    console.error(error)
  }
}





// refactor this function to make it smaller
async function dataHandling() {
  try {
    
    const funcDataArr = await fetchData() // await is only used to call the fetch functions, so making this whole thing async might be a bad idea for performance
    const searchContainer = document.getElementById("search_container");
    let html = `` // unsure if html var is needed

    
    for (let i = 0; i < 10; i++) {


      //var
      let bookCoverKey = funcDataArr.docs[i].cover_edition_key;
      let bookCoverLnk = ``;
      const descfetch = await fetch(`https://openlibrary.org${funcDataArr.docs[i].key}.json`); // i have this inside a for loop so it can iterate through the whole array, could probably make it it's own async function with a id param
      const descData = await descfetch.json(); // this seems unneeded



      //checks cover keys
      if (funcDataArr.docs[i].cover_edition_key) {
        bookCoverKey = funcDataArr.docs[i].cover_edition_key;
        bookCoverLnk = `https://covers.openlibrary.org/b/olid/${bookCoverKey}-M.jpg`;

      } else if (funcDataArr.docs[i].cover_i) {
        bookCoverKey = funcDataArr.docs[i].cover_i;
        bookCoverLnk = `https://covers.openlibrary.org/b/id/${bookCoverKey}-M.jpg`;

      } else {
        bookCoverLnk = `images/notfound.jpg`
      }

   



     //split this into its own function
      const descCheck = () => {
        if (!descData.description) {
          return "no description :("
        } else if (!descData.description.value) {
          return descData.description
        } else {
          return descData.description.value
        }
      }

      let bookDataObj = {
        title: funcDataArr.docs[i].title,
        author: funcDataArr.docs[i].author_name,
        cover: bookCoverLnk,
        description: descCheck(),
        publish_year: funcDataArr.docs[i].first_publish_year,
        tags: descData.subjects

      }
      bookStorageObjArr.push(bookDataObj)


      html += `
            <div class="book_result" onclick="bookSettingNewData(${i})">
            <img src="${bookDataObj.cover}" class="book_cover">
            <h2>${bookDataObj.title}</h2>
            <h3>${bookDataObj.author}</h3>
            <p id="description">${bookDataObj.description}</p>
            <footer>publish: ${bookDataObj.publish_year}. <span title="${bookDataObj.tags}"><u>tags</u></span></footer>
            </div>
            `
      searchContainer.innerHTML = html

    }
    console.log(bookStorageObjArr)
  } catch (error) {
    searchContainer.innerHTML = `<p>the API has failed or i think that's what happens when this fails</p>`
    console.error(error)
  }
}
// end of data handling ^




document.getElementById("bookSearch").addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    dataHandling();
    document.getElementById("search_container").togglePopover()
  }
})


const settingsAuthorName = document.getElementById("settings_author_name");
const bookSettingsCover = document.getElementById("book_settings_cover");
const bookshelfSelector = document.getElementById("bookshelf_selector");

function populateShelfOptions(){
  if(bookshelfSelector.options.length >= 1) return;
  for (i = 0; i < shelfStorage.length; i++) {
    let option = document.createElement('option');
    option.value = shelfStorage[i].bookshelf_id
    option.innerHTML = shelfStorage[i].name

    bookshelfSelector.appendChild(option)
  }
}

async function bookSettingNewData(id) {

  if (id === null || id === undefined) return "id does not exist";   
    bookSettingsCover.src = bookStorageObjArr[id].cover
    settingsAuthorName.innerText = bookStorageObjArr[id].author
    document.getElementById("settings_book_title").innerText = bookStorageObjArr[id].title
    document.getElementById("array_id").value = id
    document.querySelector("[name='mode']").value = "insert"
    populateShelfOptions()

  document.getElementById("book_selector").togglePopover()
}

async function bookSettingEditData(id) {
  if (!id) return;
    const book = await fetchBookFromBookId(id)
        bookSettingsCover.src = book.cover
    settingsAuthorName.innerText = book.author
    document.getElementById("settings_book_title").innerText = book.title
    document.getElementById('book_progress').value = book.progress
    document.getElementById('starinput').value = book.rating
    document.getElementById("array_id").value = id
    document.querySelector("[name='mode']").value = "edit"
    populateShelfOptions()
    updateStars(book.rating)

  document.getElementById("book_selector").togglePopover()
}


function updateStars(val) {
  const stars = "★★★★★".substring(0, val) + "☆☆☆☆☆".substring(val);
  document.getElementById("stars").textContent = stars
}


// event listener code




// submitting user provided input, I.E: what playlist it's in, rating, progress
document.getElementById("booksave").addEventListener('submit', function (e) {
  e.preventDefault();

  let formData = new FormData(this)
 let bookFormData = Object.fromEntries(formData.entries())
  console.log("this button works")
  document.getElementById("book_selector").hidePopover()

  if(bookFormData.mode === "insert"){
  insertBook(bookFormData); 
  } else if(bookFormData.mode === "edit"){
    console.log("this is the form data for the edit: ", formData)
    editBook(bookFormData)
  }
})
// submitting a name to create a playlist code
const inputShelfName = document.getElementById('bookshelf_name');
const error = document.getElementById('error-message');
inputShelfName.addEventListener('input', validate)

document.getElementById("shelf_input").addEventListener('submit', function (e) {
  e.preventDefault();
  document.getElementById("create_shelf_popover").hidePopover()
  
  let ShelfData = Object.fromEntries(new FormData(this).entries())
  console.log(ShelfData);
  createShelf(ShelfData)
})

function validate() {
  if (inputShelfName.validity.valid) {
    error.style.display = 'none';
  } else {
    error.textContent = 'Only letters and spaces, up to 20 characters.';
    error.style.display = 'block';
  }
}



document.getElementById('library').addEventListener('click', (e) => {
  const shelfTarget = e.target.closest('[data-bookshelf-id]')
  const bookTarget = e.target.closest('[data-book-id]')
  const createTarget = e.target.closest('[data-bookshelf-create]');
  if(shelfTarget){
    const shelfid = shelfTarget.dataset.bookshelfId;
    displayBooks(shelfid)
  } else if (bookTarget) {
    const bookId = bookTarget.dataset.bookId;
    window.location.href = `/book/${bookId}`
  } else if(createTarget){
    console.log("working")
    document.getElementById("create_shelf_popover").showPopover()
  }
})

// back end code
const baseURL = 'http://localhost:8384/'

const getbutton = document.getElementById('get')

let shelfStorage = []
async function fetchBookshelf() {
  try {
    const response = await fetch('/data/bookshelf');
    if (!response.ok) throw new Error(`HTTP error! status ${response.status}`)
    const data = await response.json();
  
    shelfStorage.push(...data)
    return data

  } catch (err) {
    console.log(err)
  }
}
async function fetchBooksFromShelfId(shelfId) {
  try {
    const response = await fetch(`/data/books/${shelfId}`);
    if(!response.ok) throw new Error(`HTTP error! status ${response.status}`)
    const data = await response.json()
    console.log(data)
    return data
  } catch(err){
    console.log(err);
  }
}
async function fetchBookFromBookId(id){
  try {
    const response = await fetch(`/data/getbook/${id}`);
    if(!response.ok) throw new Error(`HTTP error! status ${response.status}`)
    const data = await response.json()
    console.log(data)
    return data
  } catch(err){
    console.log(err);
  }
}
async function insertBook(submittedData) {
  try {
    const {array_id, ...cleanedObj} = submittedData
    let selectedBookObjMeta = {...cleanedObj, ...bookStorageObjArr[submittedData.array_id]
    }
    const response = await fetch('data/insertbook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(selectedBookObjMeta)
    })
    console.log(selectedBookObjMeta)
  } catch (err) {
    console.log(err)
  }

}



async function createShelf(shelfFormData) {
    try {
    const response = await fetch('data/createbookshelf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shelfFormData)
    })
    displayBookshelves(); // this doesn't activate because the data isn't fetched when it fires. displayBookshelves may need to be rewritten to fetch the data itself. i don't quite like making everything an async function 
  } catch (err) {
    console.log(err)
  }
}
//edit DB code
async function editBook(submittedData) {
  try {
   
    const response = await fetch('data/editbook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submittedData)
    })
    console.log(submittedData)
  } catch (err) {
    console.log(err)
  }

}
//delete DB code
async function deleteBookEntry(id) {
    try {
    const response = await fetch('data/deletebook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({id: id})
    })
  } catch (err) {
    console.log(err)
  }
}


// display code?
function displayBookshelves() { 
   document.getElementById('library').innerHTML = `
   <div class="bookshelf" data-bookshelf-create>
   <img class="bookshelf_thumbnail" src="images/27077ce3-835b-488a-b464-6a63b2f13484.jpeg" alt="u" style="display: block;">
   </div>`
   html = ''
   for (i = 0; i < shelfStorage.length; i++) {
     console.log("this thingy: ", shelfStorage[i])
     
    html = `<div class="bookshelf" data-bookshelf-id="${shelfStorage[i].bookshelf_id}" id="bookshelf">
    <img class="bookshelf_thumbnail" src="https://cdn.pixabay.com/photo/2015/08/21/18/18/eager-read-899305_1280.jpg" alt="u" style="display: block;">
    <p id="shelf_name">${shelfStorage[i].name}</p>
    </div>`
    document.getElementById("library").insertAdjacentHTML("afterBegin", html) 
  };
  document.getElementById('back-button').style.display = 'none'
}

function displayBooks(shelf_id) {
  fetchBooksFromShelfId(shelf_id)
  .then(bookMeta => {
    let html = ``
    for(let i = 0; i < bookMeta.length; i++){
      const authorsplit = bookMeta[i].author.split(", ")
      
      html += `<div><div class="books_stored" data-book-id="${bookMeta[i].id}">
      <img src="${bookMeta[i].cover}" class="book_cover_stored">
      <span style="color: white; background-color: #04AA6D;">${bookMeta[i].progress}</span>
      <h2>${bookMeta[i].title}</h2>
      <h3>${authorsplit[0]} <span title="${authorsplit.slice(1)}">:</span></h3>
      </div>
      <footer>publish: ${bookMeta[i].publish_year}  </footer>

    <button onclick="bookSettingEditData(${bookMeta[i].id})">Edit Book</button>
    <button onclick="deleteBookEntry(${bookMeta[i].id})">Delete Book</button>
      </div>
      `
    } // need to finish this ^ but i'm bored and don't wanna do it rn
    document.getElementById('library').innerHTML = html
    document.getElementById('back-button').style.display = "inline-block"
    console.log("this for loop gets called!")
  })
  .catch(err => console.error('Error', err))
}

window.onload = function () {
  fetchBookshelf()
  .then(() => {
    displayBookshelves()
  })
}



