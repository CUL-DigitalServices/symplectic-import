var Constants = module.exports.Constants = {};

Constants.API = {
    'items-per-page': 25,
    'URI': 'https://ref.cam.ac.uk:8091/publications-api/v4.6/publications'
};

Constants.publicationTypes = {
    'ARTEFACT': 'artefact',
    'BOOK': 'book',
    'CHAPTER': 'chapter',
    'COMPOSITION': 'composition',
    'CONFERENCE': 'conference',
    'DATASET': 'dataset',
    'DESIGN': 'design',
    'EXHIBITION': 'exhibition',
    'INTERNET_PUBLICATION': 'internet publication',
    'JOURNAL_ARTICLE': 'journal article',
    'OTHER': 'other',
    'PATENT': 'patent',
    'PERFORMANCE': 'performance',
    'POSTER': 'poster',
    'REPORT': 'report',
    'SCHOLARLY_EDITION': 'scholarly edition',
    'SOFTWARE': 'software',
    'THESIS': 'thesis / dissertation',
    'WORKING_PAPER': 'working paper'
};

Constants.sources = ['symplectic-manual', 'arxiv'];
