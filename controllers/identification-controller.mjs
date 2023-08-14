import * as contactRepo from '../repository/contact-repository.mjs';
import moment from 'moment';
export const identifyContact = async (req, res) => {

    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
        return res.status(400).json({ message: "Email and phoneNumber, both can't be null" });
    }

    const emailRelatedContacts = await contactRepo.findContactByEmail(email);
    const phoneNumberRelatedContacts = await contactRepo.findContactByPhoneNumber(phoneNumber);

    //if there is no contact with the given email or phoneNumber
    if (emailRelatedContacts.length === 0 && phoneNumberRelatedContacts.length === 0) {
        const linkPrecedence = "primary";
        const linkedid = null;
        const contact = await contactRepo.createContact({ email, phoneNumber, linkPrecedence, linkedid });
        const response = new Response(contact.id, [contact.email], [contact.phonenumber], null);
        return res.status(200).json({ contact: response });
    }
    const uniqueContacts = new Set([...emailRelatedContacts, ...phoneNumberRelatedContacts]);
    const relatedContacts = [...uniqueContacts];

    if (emailRelatedContacts.length > 0 && phoneNumberRelatedContacts.length > 0) {
        const contact = await contactRepo.findContact({ email, phoneNumber });
        if (contact) {
            let primaryContactId;
            let emails = new Set([]);
            let phoneNumbers = new Set([]);
            let secondaryContactIds = new Set([]);
            for (let i = 0; i < relatedContacts.length; i++) {
                emails.add(relatedContacts[i].email);
                phoneNumbers.add(relatedContacts[i].phonenumber);
                if (relatedContacts[i].linkprecedence === 'primary') {
                    primaryContactId = relatedContacts[i].id;
                } else {
                    secondaryContactIds.add(relatedContacts[i].id);
                }
            }

            emails = Array.from(emails);
            phoneNumbers = Array.from(phoneNumbers);
            secondaryContactIds = Array.from(secondaryContactIds);

            const response = new Response(primaryContactId, emails, phoneNumbers, secondaryContactIds);
            return res.status(200).json({ contact: response });
        }

        if (!contact) {
            let oldestContact = relatedContacts[0];
            for (const contact of relatedContacts) {
                if (Number(contact.createdat) < Number(oldestContact.createdat)) {
                    oldestContact = contact;
                }
            }
            const otherContact = relatedContacts.find(contact => contact.id !== oldestContact.id);

            await contactRepo.linkContacts(oldestContact.id, otherContact.id);

            const response = new Response(oldestContact.id, [oldestContact.email, otherContact.email], [oldestContact.phonenumber, otherContact.phonenumber], [otherContact.id]);
            return res.status(200).json({ contact: response });

        }
    }

    //If there exists a contacts with either the given phoneNumber or the email but not both
    if (emailRelatedContacts.length > 0 || phoneNumberRelatedContacts.length > 0) {
        let linkedid = null;
        const linkPrecedence = 'secondary';
        let emails = new Set([email]);
        let phoneNumbers = new Set([phoneNumber]);
        let secondaryContactIds = new Set([]);

        for (let i = 0; i < relatedContacts.length; i++) {
            emails.add(relatedContacts[i].email); // Use add() method of Set
            phoneNumbers.add(relatedContacts[i].phonenumber); // Use add() method of Set
            if (relatedContacts[i].linkprecedence === 'primary') {
                linkedid = relatedContacts[i].id;
            } else {
                secondaryContactIds.add(relatedContacts[i].id);
            }
        }

        // Convert Sets back to arrays
        emails = Array.from(emails);
        phoneNumbers = Array.from(phoneNumbers);
        secondaryContactIds = Array.from(secondaryContactIds);

        // Create the new contact
        const contact = await contactRepo.createContact({ email, phoneNumber, linkPrecedence, linkedid });
        secondaryContactIds.push(contact.id);
        const response = new Response(linkedid, emails, phoneNumbers, secondaryContactIds);
        return res.status(200).json({ contact: response });
    }
}

class Contact {
    constructor(phoneNumber, email, linkedId, linkPrecedence) {
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.linkedId = linkedId;
        this.linkPrecedence = linkPrecedence;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
        this.deletedAt = null;
    }
}

class Response {
    constructor(primaryContactId, emails, phoneNumbers, secondaryContactIds) {
        this.primaryContactId = primaryContactId;
        this.emails = emails;
        this.phoneNumbers = phoneNumbers;
        this.secondaryContactIds = secondaryContactIds;
    }
}
