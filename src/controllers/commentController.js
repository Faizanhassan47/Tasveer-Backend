import { addCommentToPhoto, listCommentsByPhoto } from '../services/commentService.js';

export async function getPhotoComments(req, res) {
  const comments = await listCommentsByPhoto(req.params.photoId);
  res.json({ comments });
}

export async function createPhotoComment(req, res) {
  const comment = await addCommentToPhoto({
    photoId: req.params.photoId,
    userId: req.user.id,
    text: req.body.text
  });

  res.status(201).json({ comment });
}
