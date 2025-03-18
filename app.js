const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json())

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Task schema
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    dueDate: { type: Date, required: true },
});

const Task = mongoose.model('Task', taskSchema);

// POST /tasks: Add a new task
app.post('/tasks', async (req, res) => {
    const { title, description, status, dueDate } = req.body;

    console.log(title,description,status,dueDate)

    if (!title || !description || !dueDate) {
        return res.status(400).json({ error: 'Title, description, and dueDate are required.' });
    }

    const task = new Task({ title, description, status, dueDate });

    try {
        const savedTask = await task.save();
        res.status(201).json(savedTask);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error saving task.' });
    }
});

// GET /tasks: Retrieve all tasks
app.get('/tasks', async (req, res) => {
    const { status, dueDate } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (dueDate) filter.dueDate = { $lte: new Date(dueDate) };

    try {
        const tasks = await Task.find(filter);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching tasks.' });
    }
});

// GET /tasks/:id: Retrieve a specific task by ID
app.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching task.' });
    }
});

// PUT /tasks/:id: Update task details by ID
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;

    try {
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            { title, description, status, dueDate },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Error updating task.' });
    }
});

// DELETE /tasks/:id: Delete a task by ID
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedTask = await Task.findByIdAndDelete(id);
        if (!deletedTask) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting task.' });
    }
});

// Retrieve tasks by status
app.get('/tasks/status/:status', async (req, res) => {
    const { status } = req.params;

    if (!['Pending', 'Completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Status must be "Pending" or "Completed".' });
    }

    try {
        const tasks = await Task.find({ status: status });
        if (tasks.length === 0) {
            return res.status(404).json({ error: `No tasks found with status ${status}.` });
        }
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching tasks by status.' });
    }
});

app.get('/tasks/dueDate/:dueDate', async (req, res) => {
    const { dueDate } = req.params;

    try {
        const tasks = await Task.find({ dueDate: dueDate });
        if (tasks.length === 0) {
            return res.status(404).json({ error: `No tasks found with this due date ${dueDate}.` });
        }
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching tasks by due date.' });
    }
});


// Start the application
const main = async () => {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

main();