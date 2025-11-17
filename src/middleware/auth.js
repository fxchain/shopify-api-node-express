import jwt from "jsonwebtoken";

function auth(req, res, next) {  
  const jwtToken = req.header('Authorization').replace('Bearer ', '');
  
  if (!jwtToken) {
    return res.status(401).json({ message: "Not authorized" });
  }
  
  jwt.verify(jwtToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Not authorized" });
    }
    
    req.customerId = decoded.customerId;
    next();
  });
}
export default auth;
