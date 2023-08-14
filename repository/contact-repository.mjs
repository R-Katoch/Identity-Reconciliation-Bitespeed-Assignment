import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const db = new pg.Pool({
    connectionString: process.env.postgresConnectionUrl,
    ssl: {
        rejectUnauthorized: false
    }
});
export const findContact = async (data) => {
    let query, values;

    query = `SELECT * FROM contacts WHERE email = $1 AND phonenumber = $2`;
    values = [data.email, data.phoneNumber];

    const result = await db.query(query, values);

    return result.rows[0]; // return contact
}

export const createContact = async (data) => {
    const query = `
    INSERT INTO contacts (email, phonenumber, linkprecedence, linkedid)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

    const values = [data.email, data.phoneNumber, data.linkPrecedence, data.linkedid];

    const result = await db.query(query, values);

    return result.rows[0]; // return inserted contact
}

// Get all contacts
export const getContacts = async () => {
    const result = await db.query('SELECT * FROM contacts');

    return result.rows; // return contacts array
}

export const linkContacts = async (primaryId, secondaryId) => {

    // Update secondary contact with new primary link
    await db.query(`
      UPDATE contacts 
      SET linkedid = $1, linkprecedence = $2
      WHERE id = $3
    `, [primaryId, 'secondary', secondaryId]);

}

export const findContactByEmail = async (email) => {
    try {
        const query = `SELECT * FROM contacts WHERE email = $1`;
        const result = await db.query(query, [email]);
        return result.rows; // Return contact or null
    } catch (error) {
        console.error('Error in findContactByEmail:', error);
        throw error;
    }
}

export const findContactByPhoneNumber = async (phoneNumber) => {
    try {
        const query = `SELECT * FROM contacts WHERE phonenumber = $1`;
        const result = await db.query(query, [phoneNumber]);
        return result.rows; // Return contact or null
    } catch (error) {
        console.error('Error in findContactByPhoneNumber:', error);
        throw error;
    }
}