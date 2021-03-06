import { CompoundsService } from './services/compounds.service';
import { PubChemService } from './services/pubchem.service';
import { QueueService } from './services/queue.service';
import { MetaCycService } from './services/metacyc.service';
import { WikiPathwaysService } from './services/wikipathways.service';

const compoundService = new CompoundsService(
  new PubChemService(),
  new MetaCycService(),
  new WikiPathwaysService(),
  new QueueService(),
);

// Grab env variables
require('dotenv').config();
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

const express = require('express');
const app = express();

// CORS
const cors = require('cors');
app.use(cors());

// JSON parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Agenda dashboard
const Agenda = require('agenda');
const agendash = require('agendash');

const agenda = new Agenda({ db: {
  address: `mongodb://${dbUser}:${dbPass}@ds151651.mlab.com:51651/dar-tool`,
  collection: 'agendaJobs',
} });
app.use('/agendash', agendash(agenda));

// API ROUTES
// ==========
app.get('/compounds', (req, res) => {
  // Return a list of all compound datasets in the database
  // [{id, name, owner},...]
  let { skip, limit } = req.query;
  const { order } = req.query;
  if (skip) skip = parseInt(skip, 10);
  if (limit) limit = parseInt(limit, 10);
  return compoundService.getAll(skip, limit, order)
    .then(compoundsList => res.json(compoundsList)).catch(err => res.send(err));
});

app.get('/compounds/:id', (req, res) => {
  // Return a list of the details for each compound in the dataset
  // [{id, CAS, CID, IUPAC, pubchem_assay_count, pubchem_pathway_count...},...]
  compoundService.get(req.params.id)
    .then(compounds => res.json(compounds))
    .catch(err => res.send(err));
});

app.post('/compounds', (req, res) => {
  // Create a new dataset
  // Post data: {name, dataset: [{CAS, IUPAC}, email]
  const dataset = req.body.dataset;

  compoundService.create(req.body.name, dataset, req.body.email)
    .then(msg => res.json({ message: msg }))
    .catch(err => res.send(err));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
