const { supabase, isConfigured } = require('../config/supabase');

// Persistent in-memory store for fallback & local testing
const inMemoryWallet = new Map();

class WalletService {
  async getUserDocuments(userId, { category, search, offlineOnly } = {}) {
    if (isConfigured) {
      try {
        let query = supabase
          .from('travel_wallet_documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        if (offlineOnly === 'true' || offlineOnly === true) {
          query = query.eq('is_offline_available', true);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('⚠️ Supabase wallet error (falling back to memory):', error.message);
        } else if (data) {
          let list = data;
          if (search && search.trim()) {
            const s = search.trim().toLowerCase();
            list = list.filter(d =>
              (d.title && d.title.toLowerCase().includes(s)) ||
              (d.doc_type && d.doc_type.toLowerCase().includes(s)) ||
              (d.issuing_country && d.issuing_country.toLowerCase().includes(s)) ||
              (d.notes && d.notes.toLowerCase().includes(s))
            );
          }
          return list;
        }
      } catch (err) {
        console.warn('⚠️ Supabase wallet query error:', err.message);
      }
    }

    // Mock fallback store for development & prior to Supabase migration
    let userDocs = inMemoryWallet.get(userId);
    if (!userDocs) {
      userDocs = [
        {
          id: 'doc-seed-1',
          user_id: userId,
          title: 'Republic of India Passport',
          category: 'identity',
          doc_type: 'passport',
          issuing_country: 'IND',
          expiry_date: '2032-08-20',
          trip_id: null,
          masked_number: '•••• 7889',
          flight_details: null,
          notes: 'Primary international travel passport. Valid for 6+ months.',
          is_offline_available: true,
          files: [
            {
              id: 'file-1',
              name: 'passport_front_page.jpg',
              type: 'image/jpeg',
              pageType: 'front',
              size: 142000,
              url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80'
            }
          ],
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'doc-seed-2',
          user_id: userId,
          title: 'British Airways E-Ticket LHR ➔ JFK',
          category: 'travel',
          doc_type: 'flight_ticket',
          issuing_country: 'GBR',
          expiry_date: '2026-10-16',
          trip_id: 'mock-trip-1',
          masked_number: '•••• 4192',
          flight_details: {
            airline: 'British Airways',
            flightNumber: 'BA142',
            origin: 'LHR',
            destination: 'JFK',
            departureDate: '2026-10-15',
            pnr: 'BA89LK',
            seat: '14K',
            boardingGroup: 'Group 2'
          },
          notes: 'Terminal 5 departure. Checked baggage: 2x 23kg included.',
          is_offline_available: true,
          files: [
            {
              id: 'file-2',
              name: 'ba142_boarding_pass.png',
              type: 'image/png',
              pageType: 'front',
              size: 98000,
              url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80'
            }
          ],
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      inMemoryWallet.set(userId, userDocs);
    }

    let filtered = [...userDocs];
    if (category && category !== 'all') {
      filtered = filtered.filter(d => d.category === category);
    }
    if (offlineOnly === 'true' || offlineOnly === true) {
      filtered = filtered.filter(d => d.is_offline_available);
    }
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(d =>
        (d.title && d.title.toLowerCase().includes(s)) ||
        (d.doc_type && d.doc_type.toLowerCase().includes(s)) ||
        (d.notes && d.notes.toLowerCase().includes(s))
      );
    }
    return filtered;
  }

  async getDocumentById(userId, documentId) {
    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('travel_wallet_documents')
          .select('*')
          .eq('id', documentId)
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('⚠️ Supabase getDocumentById error:', e.message);
      }
    }

    const userDocs = inMemoryWallet.get(userId) || [];
    const doc = userDocs.find(d => d.id === documentId);
    if (!doc) throw new Error('Document not found in wallet.');
    return doc;
  }

  async saveDocument(userId, docData) {
    const {
      title,
      category,
      doc_type,
      issuing_country = 'IND',
      expiry_date = null,
      trip_id = null,
      flight_details = null,
      notes = '',
      files = [],
      masked_number = null,
      is_offline_available = false
    } = docData;

    if (!title || !category || !doc_type) {
      throw new Error('Title, category, and document type are required.');
    }

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('travel_wallet_documents')
          .insert([
            {
              user_id: userId,
              title: title.trim(),
              category,
              doc_type,
              issuing_country,
              expiry_date: expiry_date || null,
              trip_id: trip_id || null,
              flight_details: flight_details || null,
              notes: notes ? notes.trim() : null,
              files: Array.isArray(files) ? files : [],
              masked_number: masked_number || null,
              is_offline_available: !!is_offline_available
            }
          ])
          .select()
          .single();

        if (!error && data) {
          return data;
        }
        console.warn('⚠️ Supabase insert failed, saving to local in-memory store:', error?.message);
      } catch (err) {
        console.warn('⚠️ Supabase error saving wallet document:', err.message);
      }
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      user_id: userId,
      title: title.trim(),
      category,
      doc_type,
      issuing_country,
      expiry_date: expiry_date || null,
      trip_id: trip_id || null,
      flight_details: flight_details || null,
      notes: notes ? notes.trim() : null,
      files: Array.isArray(files) ? files : [],
      masked_number: masked_number || null,
      is_offline_available: !!is_offline_available,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const userDocs = inMemoryWallet.get(userId) || [];
    userDocs.unshift(newDoc);
    inMemoryWallet.set(userId, userDocs);
    return newDoc;
  }

  async updateDocument(userId, documentId, updateData) {
    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('travel_wallet_documents')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('⚠️ Supabase updateDocument error:', e.message);
      }
    }

    const userDocs = inMemoryWallet.get(userId) || [];
    const index = userDocs.findIndex(d => d.id === documentId);
    if (index === -1) {
      throw new Error('Document not found');
    }

    const updated = {
      ...userDocs[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    userDocs[index] = updated;
    inMemoryWallet.set(userId, userDocs);
    return updated;
  }

  async deleteDocument(userId, documentId) {
    if (isConfigured) {
      try {
        const { error } = await supabase
          .from('travel_wallet_documents')
          .delete()
          .eq('id', documentId)
          .eq('user_id', userId);

        if (!error) {
          return { success: true, id: documentId };
        }
      } catch (e) {
        console.warn('⚠️ Supabase deleteDocument error:', e.message);
      }
    }

    const userDocs = inMemoryWallet.get(userId) || [];
    const filtered = userDocs.filter(d => d.id !== documentId);
    inMemoryWallet.set(userId, filtered);
    return { success: true, id: documentId };
  }
}

module.exports = new WalletService();
