const path = require('path');
const mariadb = require('mariadb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 8386
const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'test',
    password: 'example', // <- these would be variables pointing towards outside the project, this is just for ease of use
    database: 'BookDataStorage',
    connectionLimit: 5
})


//EXPRESS CODE
app.use(express.static(`../`))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(cors())
app.set('view engine', 'ejs');
app.set('views', './views');


app.post('/', (req, res) => {
    console.log('data:', req.body);
    res.status(200).json({message: 'Data recieved successfully', data: req.body})
})

// get below
const handlersGet = {
    bookshelf: queryBookshelf,
    books: queryBooksFromShelf,
    getbook: queryBook
}
app.get('/data/:cmd{/:id}', async(req, res, next)=> {
    const {cmd, id} = req.params
    const handler = handlersGet[cmd]
   if(!handler){
       return res.status(404).send('command not found')
   }
    try {
        await handler(req, res, id);
    } catch(err) {
        next(err)
    }
});
//this is for ejs specifically
app.get('/book/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const bookData = await getBookById(id);
    res.render('index', { data: bookData});
  } catch (error) {
    res.status(500).send('Book not found');
  }
});

// post below
const handlersPost = {
    insertbook: insertBook,
    createbookshelf: createBookshelf,
    editbook: editBookDb,
    deletebook: deleteBook,
    deleteshelf: deleteShelf
}
    app.post('/data/:cmd', async(req, res) => {
        const handlerPost = handlersPost[req.params.cmd]
        if(handlerPost){
            res.json({message: 'Data recieved successfully woo hoo!'})
            return handlerPost(req, res)

        }
        res.status(404).send('command not found')
    })
app.listen(port, () => console.log(`server is listening on port: ${port}`))


// MARIADB CODE

/*
SECURITY CONCERN:
almost none of this data is ever sanitized.
this means the database is susceptible to sql injections
the purpose of this app is not to be used by anyone other than me at the moment, so for now that's fine
if i ever get more ambitious that will have to be one of the first things that change
*/



//query code
async function queryBookshelf(req, res) {
    let conn;
       try {
           conn = await pool.getConnection(); // conn was never defined until 10 seconds ago but it was working anyway
           const bookshelfData = await conn.query("SELECT * FROM bookshelf;")
           res.json(bookshelfData)
           
        }catch (err) {
        console.error("Database operation error:", err);
        throw err; 
    } finally {
        if (conn) {
            conn.release(); 
            console.log("Connection released to pool.");
        }
    }
    }

   
    async function queryBooksFromShelf(req, res, bookshelfId) {
       
        let conn;
    try{
        conn = await pool.getConnection();
        const getBookMeta = await conn.query(`SELECT book_meta.author, book_meta.title, book_meta.cover, book_meta.description, book_meta.publish_year, book_meta.progress, book_meta.rating, book_meta.id
        FROM bookshelf_books
        JOIN book_meta ON bookshelf_books.book_id = book_meta.id
        JOIN bookshelf ON bookshelf_books.bookshelf_id = bookshelf.bookshelf_id
        WHERE bookshelf.bookshelf_id = ${bookshelfId};`)
        res.json(getBookMeta);
    }
    catch (err) {
        console.error("Database operation error:", err);
        throw err; 
    } finally {
        if (conn) {
            conn.release(); 
            console.log("Connection released to pool.");
        }
    }
    }
async function getBookById(bookId) {
       
        let conn;
    try{
        conn = await pool.getConnection();
        const getBookMeta = await conn.query(`SELECT * FROM book_meta WHERE id = ?;`, [bookId])
            return getBookMeta[0];
    }
    catch (err) {
        console.error("Database operation error:", err);
        throw err; 
    } finally {
        if (conn) {
            conn.release(); 
            console.log("Connection released to pool.");
        }
    }
    }
    async function queryBook(req, res, bookId){
        const book = await getBookById(bookId)
        if(!book) return res.status(404).json({error: 'Book not found'})
        res.json(book)
    }
//INSERT to DB code
async function createBookshelf(req, res){
let conn;
    try{
        conn = await pool.getConnection();
        const response = await conn.query('INSERT INTO bookshelf (name) VALUES  (?);', [req.body.shelf_name])
    }
    catch (err) {
        console.error("Database operation error:", err);
        throw err; 
    } finally {
        if (conn) {
            conn.release(); 
            console.log("Connection released to pool.");
        }
    }
}

async function insertBook(req, res) {
    let conn;
    try{
        conn = await pool.getConnection();
        const sanitized = Object.fromEntries(
            Object.entries(req.body).map(([key, value]) => [key, Array.isArray(value) ? value.join(', '): value]) // turning all arrays from an object into strings
        )
        
        const response = await conn.query('INSERT INTO book_meta (author, title, cover, description, publish_year, progress, rating) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);',
            [sanitized.author, sanitized.title, sanitized.cover, sanitized.description, sanitized.publish_year, sanitized.book_progress, sanitized.rating]
        ); 
          await conn.query('INSERT INTO bookshelf_books (book_id, bookshelf_id) VALUES (?, ?);',
            [response.insertId, sanitized.bookshelf_id] //insers it into the junction table
        )
    }
    catch (err) {
        console.error("Database operation error:", err);
        throw err;
    } finally {
        if (conn) {
            conn.release(); 
            console.log("Connection released to pool.");
        }
    }
}
// edit functions code
async function editBookDb(req, res) {
let conn;
    try{
        conn = await pool.getConnection();
        const response = await conn.query(`
            UPDATE book_meta
            JOIN bookshelf_books ON book_meta.id = bookshelf_books.book_id
            SET progress = ?, 
                rating = ?, 
                bookshelf_id = ?
               WHERE book_meta.id = ?;`, [req.body.book_progress, req.body.rating, req.body.bookshelf_id, req.body.array_id])
            console.log("this function was called, and response var is: ", response, "body is :", req.body)
            }
    catch (err) {
        console.error("Database operation error:", err);
        throw err; 
    } finally {
        if (conn) {
            conn.release(); 
            console.log("Connection released to pool.");
        }
    }
}
// delete functions code
async function deleteBook(req, res) {
let conn;
    try{
        conn = await pool.getConnection();
       
        console.log(req.body.id)
        const response = await conn.query(`
            DELETE book_meta, bookshelf_books
            FROM book_meta
            JOIN bookshelf_books ON book_meta.id = bookshelf_books.book_id
            WHERE book_meta.id = ?;`, [req.body.id])
    }
    catch (err) {
        console.error("Database operation error:", err);
        throw err; 
    } finally {
        if (conn) {
            conn.release(); 
            console.log("Connection released to pool.");
        }
    }
}
async function deleteShelf(req, res) {
let conn;
    try{
        conn = await pool.getConnection();
        const response = await conn.query(`
            DELETE bookshelf, bookshelf_books
            FROM bookshelf
            JOIN bookshelf_books ON bookshelf.bookshelf_id = bookshelf_books.bookshelf_id
            WHERE book_meta.id = ?;`, [req.body.id])
    }
    catch (err) {
        console.error("Database operation error:", err);
        throw err; 
    } finally {
        if (conn) {
            conn.release(); 
            console.log("Connection released to pool.");
        }
    }
}
/*
--------------------------TEMPLATE----------------------------------
async function name(req, res) {
let conn;
    try{
        conn = await pool.getConnection();
        const response = await conn.query('INSERT INTO bookshelf (name) VALUES  (?);', [req.body.shelf_name])
    }
    catch (err) {
        console.error("Database operation error:", err);
        throw err; 
    } finally {
        if (conn) {
            conn.release(); 
            console.log("Connection released to pool.");
        }
    }
}
--------------------------TEMPLATE----------------------------------
*/

/* async function executeDatabaseOperations() {
    let conn;
    try {
        conn = await pool.getConnection(); // Get a connection from the pool

        // --- SELECT Query ---
        const rows = await conn.query("SELECT book_cover_id, book_name FROM booktest WHERE book_author = ?", ["active"]);
        console.log("Selected Rows:", rows);

        // --- INSERT Query (with parameters for security) ---
        const res = await conn.query("INSERT INTO booktest (name, status) VALUES (?, ?)", ["New Entry", "pending"]);
        console.log("Insert Result:", res); // res will contain { affectedRows: 1, insertId: ..., warningStatus: 0 }

    } catch (err) {
        console.error("Database operation error:", err);
        throw err; // Re-throw to handle higher up
    } finally {
        if (conn) {
            conn.release(); // Release connection back to the pool
            console.log("Connection released to pool.");
        }
    }
}

// Call the async function
executeDatabaseOperations()
    .then(() => console.log("All database operations attempted."))
    .catch((err) => console.error("Overall operation failed:", err))
    .finally(() => {
        // Optional: End the pool when your application is shutting down
        // pool.end();
        // console.log("Connection pool ended.");
    });

    */