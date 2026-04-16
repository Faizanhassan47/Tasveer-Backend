import { createNewPhoto, getPhotoById, listPhotos } from '../services/photoService.js';

export async function getPhotos(req, res) {
  const photos = await listPhotos({
    query: req.query.q,
    sort: req.query.sort || 'newest',
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 12),
    viewerId: req.user?.id || null
  });

  res.json({ photos });
}

export async function getPhoto(req, res) {
  const photo = await getPhotoById(req.params.photoId, req.user?.id || null);
  res.json({ photo });
}

export async function createPhoto(req, res) {
  const photo = await createNewPhoto({
    ...req.body,
    file: req.file,
    userId: req.user.id
  });

  res.status(201).json({ photo });
}
