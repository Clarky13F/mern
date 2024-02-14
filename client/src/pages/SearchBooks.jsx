import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Container, Col, Form, Button, Card, Row } from 'react-bootstrap';
import axios from 'axios';

import Auth from '../utils/auth';
import { SAVE_BOOK } from '../utils/mutations';
import { GET_ME } from '../utils/queries';


const SearchBooks = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchedBooks, setSearchedBooks] = useState([]);
  const [savedBookIds, setSavedBookIds] = useState([]);

  const [saveBook] = useMutation(SAVE_BOOK);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchInput)}`);
      const booksFromGoogle = response.data.items || [];

      const books = booksFromGoogle.map((book) => ({
        authors: book.volumeInfo.authors || ['No author to display'],
        description: book.volumeInfo.description || 'No description available',
        bookId: book.id,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
        link: book.volumeInfo.infoLink || '',
        title: book.volumeInfo.title,
      }));

      setSearchedBooks(books);
    } catch (error) {
      console.error(error);
      setSearchedBooks([]);
    }
  };

  const handleSaveBook = async (bookId) => {
    try {

      const bookToSave = searchedBooks.find((book) => book.bookId === bookId);
      await saveBook({
        variables: {
          bookData: {
            authors: bookToSave.authors,
            description: bookToSave.description,
            bookId: bookId,
            image: bookToSave.image,
            link: bookToSave.link,
            title: bookToSave.title,
          },
        },
        context: {
          headers: {
            authorization: Auth.getToken() ? `Bearer ${Auth.getToken()}` : '',
          },
        },
      });

      setSavedBookIds((prevIds) => [...prevIds, bookId]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className='pt-5'>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => {
            return (
              <Col md="4" key={book.bookId}>
                <Card border='dark'>
                  {book.image ? (
                    <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    {Auth.loggedIn() && (
                      <Button
                        disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
                        className='btn-block btn-info'
                        onClick={() => handleSaveBook(book.bookId)}>
                        {savedBookIds?.some((savedBookId) => savedBookId === book.bookId)
                          ? 'This book has already been saved!'
                          : 'Save this Book!'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;
