const handleErrors = (errors, isUserError, res) => {
  if (isUserError) {
    res.status(400).json({ errors });
  } else {
    const errorsMessage = [];
  
    errors.graphQLErrors.forEach(error => {
        errorsMessage.push(error.message);
    });
    
    const error = {
        message: errors.message,
        errors: errorsMessage
    }

    res.status(400).json({ error });
  } 
    return;
}

export default handleErrors;