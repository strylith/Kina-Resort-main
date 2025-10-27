// Mock Database Client - In-memory implementation for testing

class MockDatabaseClient {
  constructor() {
    // In-memory storage using Maps
    this.tables = {
      users: new Map(),
      packages: new Map(),
      bookings: new Map(),
      booking_items: new Map(),
      reservations_calendar: new Map(),
      admin_settings: new Map()
    };
    
    // Auth users (for auth.admin methods)
    this.authUsers = new Map();
  }

  // Reset all tables
  reset() {
    Object.keys(this.tables).forEach(key => this.tables[key].clear());
    this.authUsers.clear();
    console.log('Mock database reset');
  }

  // Seed test data
  seed(tableName, records) {
    if (!this.tables[tableName]) {
      throw new Error(`Table ${tableName} does not exist`);
    }
    
    records.forEach(record => {
      const id = record.id || this.generateId();
      this.tables[tableName].set(id, { id, ...record });
    });
  }

  // Generate mock ID
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Table query builder (Supabase-style API)
  from(tableName) {
    if (!this.tables[tableName]) {
      throw new Error(`Table ${tableName} does not exist`);
    }
    
    return new MockQueryBuilder(this.tables[tableName], tableName);
  }

  // Auth client
  auth = {
    admin: {
      createUser: async (userData) => {
        const id = userData.id || this.generateId();
        const user = {
          id,
          email: userData.email,
          user_metadata: userData.user_metadata || {},
          created_at: new Date().toISOString(),
          ...userData
        };
        
        this.authUsers.set(id, user);
        return { data: { user }, error: null };
      },

      deleteUser: async (userId) => {
        this.authUsers.delete(userId);
        return { data: null, error: null };
      },

      getUserById: async (userId) => {
        const user = this.authUsers.get(userId);
        return { data: user, error: user ? null : { message: 'User not found' } };
      },

      listUsers: async () => {
        return {
          data: { users: Array.from(this.authUsers.values()) },
          error: null
        };
      }
    },

    signInWithPassword: async ({ email, password }) => {
      // Find user by email in authUsers
      const user = Array.from(this.authUsers.values()).find(u => u.email === email);
      
      if (!user) {
        return { data: null, error: { message: 'Invalid email or password' } };
      }

      return { data: { user }, error: null };
    },

    resetPasswordForEmail: async (email, options) => {
      // Mock implementation - just return success
      return { data: null, error: null };
    }
  };
}

// Query builder class for method chaining
class MockQueryBuilder {
  constructor(table, tableName) {
    this.table = table;
    this.tableName = tableName;
    this.filters = [];
    this.selectFields = '*';
  }

  // Select fields
  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  // Filter: equals
  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  // Filter: in
  in(column, values) {
    this.filters.push({ type: 'in', column, values });
    return this;
  }

  // Filter: greater than or equal
  gte(column, value) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  // Filter: less than or equal
  lte(column, value) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  // Single result
  single() {
    this.limitValue = 1;
    return this;
  }

  // Order by
  order(column, options = {}) {
    this.orderBy = { column, ascending: options.ascending !== false };
    return this;
  }

  // Apply filters to data
  applyFilters(data) {
    if (this.filters.length === 0) return data;
    
    return data.filter(record => {
      return this.filters.every(filter => {
        switch (filter.type) {
          case 'eq':
            return record[filter.column] === filter.value;
          case 'in':
            return filter.values.includes(record[filter.column]);
          case 'gte':
            return record[filter.column] >= filter.value;
          case 'lte':
            return record[filter.column] <= filter.value;
          default:
            return true;
        }
      });
    });
  }

  // Execute query
  async then(resolve, reject) {
    try {
      const allData = Array.from(this.table.values());
      let filteredData = this.applyFilters(allData);

      // Apply ordering if specified
      if (this.orderBy) {
        filteredData.sort((a, b) => {
          const aVal = a[this.orderBy.column];
          const bVal = b[this.orderBy.column];
          
          if (aVal < bVal) return this.orderBy.ascending ? -1 : 1;
          if (aVal > bVal) return this.orderBy.ascending ? 1 : -1;
          return 0;
        });
      }

      // Limit results if specified
      if (this.limitValue === 1) {
        filteredData = filteredData.slice(0, 1);
      }

      // Return in Supabase format
      const result = {
        data: this.limitValue === 1 ? (filteredData[0] || null) : filteredData,
        error: null
      };

      resolve(result);
      return result;
    } catch (error) {
      const result = { data: null, error };
      reject(error);
      return result;
    }
  }

  // Insert operation
  async insert(record) {
    const id = record.id || this.table.size + 1;
    const newRecord = { id, ...record, created_at: new Date().toISOString() };
    this.table.set(id, newRecord);
    
    return { data: newRecord, error: null };
  }

  // Update operation
  async update(updates) {
    const allData = Array.from(this.table.values());
    const toUpdate = this.applyFilters(allData);
    
    toUpdate.forEach(record => {
      const updated = { ...this.table.get(record.id), ...updates, updated_at: new Date().toISOString() };
      this.table.set(record.id, updated);
    });

    return { data: toUpdate, error: null };
  }

  // Delete operation
  async delete() {
    const allData = Array.from(this.table.values());
    const toDelete = this.applyFilters(allData);
    
    toDelete.forEach(record => {
      this.table.delete(record.id);
    });

    return { data: toDelete, error: null };
  }
}

// Create singleton instance
const mockClient = new MockDatabaseClient();

export default mockClient;

