-- Allow DOCX contracts in project-files bucket
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'project-files';

