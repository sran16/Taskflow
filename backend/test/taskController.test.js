import { afterEach, expect, jest, test } from '@jest/globals'

import { createTask, deleteTask, updateTask } from '../src/controllers/taskController.js'
import { Task } from '../src/models/Task.js'

afterEach(() => {
  jest.restoreAllMocks()
})

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn()
  }
}

const userId = '64b000000000000000000001'
const taskId = '64b000000000000000000002'

test('Créer une tâche', async () => {
  const task = { _id: taskId, title: 'Faire les tests', status: 'todo' }
  jest.spyOn(Task, 'create').mockResolvedValue(task)

  const req = {
    user: { _id: userId },
    body: { title: 'Faire les tests', status: 'todo' }
  }
  const res = createResponse()

  await createTask(req, res)

  expect(Task.create).toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(201)
  expect(res.json).toHaveBeenCalled()
})

test('Créer une tâche échoue', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(Task, 'create').mockRejectedValue(new Error('Erreur base de données'))
  const res = createResponse()

  await createTask({ user: { _id: userId }, body: { title: 'Test', status: 'todo' } }, res)

  expect(res.status).toHaveBeenCalledWith(500)
})

test('Modifier une tâche', async () => {
  const task = {
    _id: taskId,
    title: 'Ancien titre',
    status: 'todo',
    save: jest.fn().mockResolvedValue()
  }
  jest.spyOn(Task, 'findOne').mockResolvedValue(task)
  const req = {
    user: { _id: userId },
    params: { id: taskId },
    body: { title: 'Nouveau titre', status: 'done' }
  }
  const res = createResponse()

  await updateTask(req, res)

  expect(Task.findOne).toHaveBeenCalled()
  expect(task.save).toHaveBeenCalled()
  expect(res.json).toHaveBeenCalled()
})

test('Modifier une tâche inexistante', async () => {
  jest.spyOn(Task, 'findOne').mockResolvedValue(null)
  const res = createResponse()

  await updateTask({ user: { _id: userId }, params: { id: taskId }, body: { title: 'Nouveau titre' } }, res)

  expect(res.status).toHaveBeenCalledWith(404)
})

test('Supprimer une tâche', async () => {
  jest.spyOn(Task, 'findOneAndDelete').mockResolvedValue({ _id: taskId, title: 'Faire les tests' })
  const req = { user: { _id: userId }, params: { id: taskId } }
  const res = createResponse()

  await deleteTask(req, res)

  expect(Task.findOneAndDelete).toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(204)
  expect(res.end).toHaveBeenCalled()
})

test('Supprimer une tâche inexistante', async () => {
  jest.spyOn(Task, 'findOneAndDelete').mockResolvedValue(null)
  const res = createResponse()

  await deleteTask({ user: { _id: userId }, params: { id: taskId } }, res)

  expect(res.status).toHaveBeenCalledWith(404)
})
