#!/usr/bin/env node

import dbClient from './db.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import gradient from 'gradient-string';
import figlet from 'figlet';

const viewAllContacts = async () => {
    console.clear();
    const query = 'SELECT * FROM contacts';

    try {
        const results = await new Promise((resolve, reject) => {
            dbClient.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if (results.rowCount === 0) {
            console.log(chalk.blue('There are no contacts.\n'));
            return;
        }

        console.log('Contacts:\n');
        results.rows
            .sort((a, b) => a.id - b.id)
            .forEach((contact) => {
                console.log(`Contact ID: ${contact.id}\nFirst Name: ${contact.first_name}\nLast Name: ${contact.last_name}\nPhone Number: ${contact.phone_number}\nEmail: ${contact.email}\nAddress: ${contact.address ? contact.address : 'No address provided'}\n`);
            });
    } catch (error) {
        console.error('Error fetching contacts:', error);
    }
};

const createContact = async () => {
    const contact = await inquirer.prompt([
        {
            name: 'first_name',
            type: 'input',
            message: 'Enter the first name:',
            default() {
                return 'John';
            }
        },
        {
            name: 'last_name',
            type: 'input',
            message: 'Enter the last name:',
            default() {
                return 'Doe';
            }
        },
        {
            name: 'phone_number',
            type: 'input',
            message: 'Enter the phone number:',
            default() {
                return '123-456-7890';
            }
        },
        {
            name: 'email',
            type: 'input',
            message: 'Enter the email address:',
            default() {
                return 'john@example.com';
            }
        },
        {
            name: 'address',
            type: 'input',
            message: 'Enter the address (optional):',
        },
    ]);

    const query = {
        text: 'INSERT INTO contacts (first_name, last_name, phone_number, email, address) VALUES ($1, $2, $3, $4, $5)',
        values: [contact.first_name, contact.last_name, contact.phone_number, contact.email, contact.address],
    };

    try {
        await new Promise((resolve, reject) => {
            dbClient.query(query, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        console.log(chalk.blue('\nContact created successfully!\n'));
        
    } catch (error) {
        console.error('Error creating contact:', error);
    }
};

const updateContact = async () => {
    const contactId = await inquirer.prompt({
        name: 'id',
        type: 'input',
        message: 'Enter the ID of the contact you want to update:',
    });

    if (isNaN(contactId.id)) {
        console.log(chalk.red('\nContact ID needs to be an integer.\n'));
        return;
    }

    const query = {
        text: 'SELECT * FROM contacts WHERE id = $1',
        values: [contactId.id],
    };

    try {
        const results = await new Promise((resolve, reject) => {
            dbClient.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if (results.rowCount === 0) {
            console.log(chalk.red('\nContact not found.\n'));
            return;
        }

        const contact = results.rows[0];

        const updatedContact = await inquirer.prompt([
            {
                name: 'first_name',
                type: 'input',
                message: 'Enter the first name:',
                default() {
                    return contact.first_name;
                }
            },
            {
                name: 'last_name',
                type: 'input',
                message: 'Enter the last name:',
                default() {
                    return contact.last_name;
                }
            },
            {
                name: 'phone_number',
                type: 'input',
                message: 'Enter the phone number:',
                default() {
                    return contact.phone_number;
                }
            },
            {
                name: 'email',
                type: 'input',
                message: 'Enter the email address:',
                default() {
                    return contact.email;
                }
            },
            {
                name: 'address',
                type: 'input',
                message: 'Type "none" to remove your address, press Enter to use your current one, or type a brand new address:',
            },
        ]);

        if (updatedContact.address === 'none') {
            updatedContact.address = '';
        }
        else if (updatedContact.address === '') {
            updatedContact.address = contact.address;
        }

        const updateQuery = {
            text: 'UPDATE contacts SET first_name = $1, last_name = $2, phone_number = $3, email = $4, address = $5 WHERE id = $6',
            values: [updatedContact.first_name, updatedContact.last_name, updatedContact.phone_number, updatedContact.email, updatedContact.address, contactId.id],
        };

        await new Promise((resolve, reject) => {
            dbClient.query(updateQuery, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        console.log(chalk.blue('\nContact updated successfully!\n'));
    } catch (error) {
        console.error('Error updating contact:', error);
    }
};

const deleteContact = async () => {
    const contactId = await inquirer.prompt({
        name: 'id',
        type: 'input',
        message: 'Enter the ID of the contact you want to delete:',
    });

    if (isNaN(contactId.id)) {
        console.log(chalk.red('\nContact ID needs to be an integer.\n'));
        return;
    }

    const query = {
        text: 'SELECT * FROM contacts WHERE id = $1',
        values: [contactId.id],
    };

    try {
        const results = await new Promise((resolve, reject) => {
            dbClient.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if (results.rowCount === 0) {
            console.log(chalk.red('\nContact not found.\n'));
            return;
        }

        const deleteQuery = {
            text: 'DELETE FROM contacts WHERE id = $1',
            values: [contactId.id],
        };

        await new Promise((resolve, reject) => {
            dbClient.query(deleteQuery, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        console.log(chalk.blue('\nContact deleted successfully!\n'));
    } catch (error) {
        console.error('Error deleting contact:', error);
    }
};

const main = async () => {
    const welcome = "Contact Manager";

    const figletPromise = new Promise((resolve, reject) => {
        figlet(welcome, (err, data) => {
            if (err) {
                reject(err);
            } else {
                console.log(gradient('red', 'white', 'blue').multiline(data));
                resolve();
            }
        });
    });

    await figletPromise;

    while (true) {
        const askQuestion = await inquirer.prompt({
            name: 'answer',
            type: 'list',
            message: 'What would you like to do?',
            choices: [
                'View all contacts',
                'Create a new contact',
                'Update an existing contact',
                'Delete a contact',
                'Exit',
            ],
            default() {
                return 'View all contacts';
            },
        });

        console.log();

        if (askQuestion.answer === "View all contacts") {
            await viewAllContacts();
        }
        else if (askQuestion.answer === "Create a new contact") {
            await createContact();
        }
        else if (askQuestion.answer === "Update an existing contact") {
            await updateContact();
        }
        else if (askQuestion.answer === "Delete a contact") {
            await deleteContact();
        }
        else if (askQuestion.answer === "Exit") {
            console.log(chalk.blue('Goodbye!'));
            await dbClient.end();
            process.exit(0);
        }
    }
};

await main();