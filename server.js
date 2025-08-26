const express = require('express');
const { TableClient } = require('@azure/data-tables');

const app = express();
app.use(express.static('public'));
app.use(express.json());

const conn = process.env.STORAGE_CONNECTION_STRING;
const tableName = process.env.TABLE_NAME || 'todos';
const client = TableClient.fromConnectionString(conn, tableName);

// health
app.get('/', (req,res)=>res.send('OK'));

// list
app.get('/api/todos', async (req,res)=>{
  const items = [];
  for await (const e of client.listEntities()) items.push(e);
  res.json(items);
});

// add { "text": "..." }
app.post('/api/todos', async (req,res)=>{
  const id = Date.now().toString();
  const entity = { partitionKey: 'p1', rowKey: id, text: req.body.text||'', done:false };
  await client.createEntity(entity);
  res.status(201).json(entity);
});

// toggle
app.post('/api/todos/:id/toggle', async (req,res)=>{
  const id = req.params.id;
  const entity = await client.getEntity('p1', id);
  entity.done = !entity.done;
  await client.updateEntity(entity, 'Replace');
  res.json(entity);
});

// delete
app.delete('/api/todos/:id', async (req,res)=>{
  await client.deleteEntity('p1', req.params.id);
  res.status(204).end();
});

const port = process.env.PORT || 8080;
app.listen(port, ()=>console.log(`listening on ${port}`));
