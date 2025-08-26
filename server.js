const express = require('express');
const { TableClient } = require('@azure/data-tables');
const { DefaultAzureCredential } = require('@azure/identity');

const app = express();
app.use(express.static('public'));
app.use(express.json());

const accountName = process.env.STORAGE_ACCOUNT_NAME;
const tableName = process.env.TABLE_NAME;
if (!accountName) throw new Error('Missing STORAGE_ACCOUNT_NAME');
if (!tableName) throw new Error('Missing TABLE_NAME');

const url = `https://${accountName}.table.core.windows.net`;
const client = new TableClient(url, tableName, new DefaultAzureCredential());

app.get('/', (_req, res) => res.send('OK'));

app.get('/api/todos', async (_req, res) => {
  const items = [];
  for await (const e of client.listEntities()) items.push(e);
  res.json(items);
});

app.post('/api/todos', async (req, res) => {
  const id = Date.now().toString();
  const entity = { partitionKey: 'p1', rowKey: id, text: (req.body && req.body.text) || '', done: false };
  await client.createEntity(entity);
  res.status(201).json(entity);
});

app.post('/api/todos/:id/toggle', async (req, res) => {
  const entity = await client.getEntity('p1', req.params.id);
  entity.done = !entity.done;
  await client.updateEntity(entity, 'Replace');
  res.json(entity);
});

app.delete('/api/todos/:id', async (req, res) => {
  await client.deleteEntity('p1', req.params.id);
  res.status(204).end();
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`listening on ${port}`));
