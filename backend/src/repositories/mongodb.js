export async function createMongoRepositories() {
  const [{ connectDB }, { default: User }, { default: Appointment }, { default: Medicine }] = await Promise.all([
    import("../lib/mongodb.js"), import("../lib/models/Users.js"), import("../lib/models/appointment.js"), import("../lib/models/medicine.js"),
  ]);
  await connectDB();
  const plain = (doc) => doc?.toObject ? doc.toObject() : doc;
  const userView = (user) => user && ({ ...plain(user), _id: String(user._id), ID: user.ID, password: user.password, parent: user.parent });
  return {
    users: {
      async findById(id) { return userView(await User.findById(id)); },
      async findByInstitutionId(ID, type) { return userView(await User.findOne({ ID: String(ID).toLowerCase(), ...(type ? { type } : {}) })); },
      async create(input) { const userId = new User()._id; await User.collection.insertOne({ _id: userId, name: input.name, ID: input.institutionId, password: input.passwordHash, role: input.role, type: input.type, parent: input.parentId, phone: input.phone, createdAt: new Date(), updatedAt: new Date() }); return this.findById(userId); },
      async updateRefreshToken(id, refreshToken) { await User.findByIdAndUpdate(id, { refreshToken }); },
      async byParent(parent) { return (await User.find({ type: "student", parent })).map(userView); },
      async byIds(ids) { return (await User.find({ ID: { $in: ids } })).map(userView); },
      async list() { return (await User.find()).map(userView); },
    },
    appointments: {
      async create(input) { return plain(await Appointment.create(input)); },
      async findById(id) { return plain(await Appointment.findById(id)); },
      async byStudent(student) { return (await Appointment.find({ student })).map(plain); },
      async byDoctor(doctor) { return (await Appointment.find({ doctor })).map(plain); },
      async byParent(parent) { return (await Appointment.find({ parent })).map(plain); },
      async pending() { return (await Appointment.find({ status: "pending" })).map(plain); },
      async update(id, values) { return plain(await Appointment.findByIdAndUpdate(id, values, { new: true })); },
    },
    orders: {
      async createMany(items) { return (await Medicine.insertMany(items)).map(plain); },
      async byStudent(student) { return (await Medicine.find({ student_id: student }).sort({ createdAt: -1 })).map(plain); },
      async byDoctor(doctor) { return (await Medicine.find({ doctor_id: doctor, request_type: "stock" }).sort({ createdAt: -1 })).map(plain); },
      async byStudents(students) { return (await Medicine.find({ student_id: { $in: students }, request_type: "medicine" })).map(plain); },
    },
  };
}
