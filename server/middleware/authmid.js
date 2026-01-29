// export const requireAuth = (req, res, next) => {
//   if (!req.session.user) {
//     return res.status(401).json({ msg: "Unauthorized" });
//   }
//   next();
// };

export const requireAuth = (req, res, next) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  next();
};