import pkg from 'pg';
const { Client } = pkg;

const connectionOptions = {
    host: 'localhost',
    port: 5432,
    user: 'root',
    password: 'root',
    database: 'contact_manager'
};
const dbClient = new Client(connectionOptions);

dbClient.connect((err) => {});

export default dbClient;