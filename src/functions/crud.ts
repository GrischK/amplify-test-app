import {generateClient} from "aws-amplify/api";
import type {Schema} from "../../amplify/data/resource.ts";

const client = generateClient<Schema>();

export function createTodo(formData: FormData) {
    const todoData = {
        content: formData.get('content')?.toString() || '',
        isDone: false
    };

    client.models.Todo.create(todoData, {
        authMode: 'userPool',
    }).then((createdTodo) => {
        const todoId = createdTodo.data?.id;

        const selectedTags = formData.getAll('tags') as Array<string>;

        selectedTags.forEach((tagId) => {
            client.models.TodoTag.create({
                todoId: todoId!,
                tagId: tagId
            }, {authMode: 'apiKey'});
        });
    });
}

export function deleteTodo(id: string) {
    client.models.TodoTag.list({
        filter: {todoId: {eq: id}},
        authMode: 'apiKey'
    }).then(({data}) => {
        const todoTagDeletions = data.map((todoTag) => {
            return client.models.TodoTag.delete({id: todoTag.id}, {authMode: 'apiKey'});
        });
        Promise.all(todoTagDeletions).then(() => {
            client.models.Todo.delete({id});
        }).catch((error) => {
            console.error("Erreur lors de la suppression des relations TodoTag :", error);
        });
    }).catch((error) => {
        console.error("Erreur lors de la récupération des relations TodoTag :", error);
    });
}

export function updateTodo(id: string, currentContent: string) {
    const updatedContent = window.prompt("Update Todo content", currentContent);
    if (updatedContent) {
        client.models.Todo.update({id, content: updatedContent}, {authMode: 'userPool'});
    }
}

export function updateTodoIsDone(id: string, currentIsDone: boolean) {
    client.models.Todo.update({id, isDone: !currentIsDone})
}

export function createTag() {
    client.models.Tag.create({name: window.prompt("Tag name")}, {authMode: 'apiKey'});
}

export function updateTag(id: string, currentName: string) {
    const updatedContent = window.prompt("Update Tag name", currentName);
    if (updatedContent) {
        client.models.Tag.update({id, name: updatedContent}, {authMode: 'apiKey'});
    }
}

export function deleteTag(id: string) {
    client.models.TodoTag.list({
        filter: {tagId: {eq: id}},
        authMode: 'apiKey'
    }).then(({data}) => {
        const todoTagDeletions = data.map((todoTag) => {
            return client.models.TodoTag.delete({id: todoTag.id}, {authMode: 'apiKey'});
        });
        Promise.all(todoTagDeletions).then(() => {
            client.models.Tag.delete({id}, {authMode: 'apiKey'});
        }).catch((error) => {
            console.error("Erreur lors de la suppression des relations TodoTag :", error);
        });
    }).catch((error) => {
        console.error("Erreur lors de la récupération des relations TodoTag :", error);
    });
}