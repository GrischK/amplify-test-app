import type {Schema} from "../amplify/data/resource";
import {useEffect, useState} from "react";
import {fetchUserAttributes} from 'aws-amplify/auth';
import {generateClient} from "aws-amplify/data";
import {Authenticator} from "@aws-amplify/ui-react";
import '@aws-amplify/ui-react/styles.css';
import {
    createTag,
    createTodo,
    deleteTag,
    deleteTodo,
    updateTag,
    updateTodo,
    updateTodoIsDone
} from "./functions/crud.ts";

const client = generateClient<Schema>();

function App() {
    const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
    const [tags, setTags] = useState<Array<Schema["Tag"]["type"]>>([]);
    const [displayForm, setDisplayForm] = useState<boolean>(false);
    const [sayHelloResponse, setSayHelloResponse] = useState<string | null>(null);
    const [todosWithTags, setTodosWithTags] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<string | undefined>(undefined);
    const [connectedUser, setConnectedUser] = useState<any>(undefined)

    useEffect(() => () => {
        setCurrentUser(undefined)
    }, []);

    useEffect(() => {
        async function fetchDataUser() {
            const user = await fetchUserAttributes();
            if (user) {
                setCurrentUser(user?.preferred_username);
            }
        }

        fetchDataUser();

        let todoSub: any;
        let tagSub: any;

        async function fetchData() {
            const user = await fetchUserAttributes();

            if (user?.sub) {
                // A chaque changement dans les données on met à jour les todos
                todoSub = client.models.Todo.observeQuery({
                    authMode: "userPool"
                }).subscribe({
                    next: (data) => setTodos([...data.items]),
                });
            }

            // Mise à jour les tags
            tagSub = client.models.Tag.observeQuery(
                {authMode: "apiKey"}
            ).subscribe({
                next: (data) => setTags([...data.items]),
            });
        }

        fetchData();

        // On se désabonne de l'observation lorsque le composant est démonté pour éviter les effets de bord
        return () => {
            todoSub?.unsubscribe();
            tagSub?.unsubscribe();
        };
    }, [connectedUser]);

    useEffect(() => {
        async function fetchTodosWithTags() {
            const todosWithTagsData = await Promise.all(todos.map(async (todo) => {
                const todoTags = await client.models.TodoTag.list({
                    filter: {todoId: {eq: todo.id}},
                    authMode: "apiKey"
                });
                const tagsId = todoTags.data.map((todoTag) => todoTag.tagId);
                // Récupération des noms des tags associés
                const tags = await Promise.all(tagsId.map(async (id) => {
                    const tag = await client.models.Tag.get({id: id}, {authMode: "apiKey"});
                    return tag.data; // Récupération du nom du tag
                }));
                return {...todo, tags};
            }));

            setTodosWithTags(todosWithTagsData);
        }

        fetchTodosWithTags();
    }, [todos, tags]);

    useEffect(() => {
        async function fetchSayHello() {
            const response = await client.queries.sayHello({name: "Grischka"});
            setSayHelloResponse(response.data);
        }

        fetchSayHello();
    }, []);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        createTodo(formData);
        setDisplayForm(false);
    }

    return (
        <Authenticator
            signUpAttributes={['email', 'preferred_username']}
            formFields={{
                signUp: {
                    preferred_username: {
                        label: 'Username',
                        placeholder: 'Enter your username',
                        isRequired: true,
                    }
                }
            }}
        >
            {({signOut, user}) => {
                setConnectedUser(user)
                return (
                    <>
                        <div className={"page_container"}>
                            <div>
                                Hello {currentUser}
                            </div>
                            <button onClick={signOut} className='signOutBtn'>
                                Sign out
                            </button>
                        </div>
                        <main>
                            <div>
                                <div>
                                    {sayHelloResponse}
                                </div>
                                🥳 App successfully hosted. Try creating a new todo.
                                <br/>
                                <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
                                    Review next step of this tutorial.
                                </a>
                            </div>
                            <div className="todosAndTags_wrapper">
                                <div className="todos_container">
                                    <h1>My todos</h1>
                                    <button onClick={() => setDisplayForm(true)}>
                                        + new todo
                                    </button>
                                    <ul>
                                        {todosWithTags.map((todo) => (
                                            <li key={todo.id}>
                                                <div className="todoList_wrapper">
                                                    <div className="todoContent_wrapper">
                                                        <input type="checkbox"
                                                               checked={todo.isDone ?? false}
                                                               onChange={() => updateTodoIsDone(todo.id, !!todo.isDone)}
                                                        />
                                                        <span>
                                                            {todo.content}
                                                        </span>
                                                    </div>
                                                    <div className="todoButtons_wrapper">
                                                        <button onClick={() => deleteTodo(todo.id)}>
                                                            Delete
                                                        </button>
                                                        <button onClick={() => updateTodo(todo.id, todo.content || '')}>
                                                            Update
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className='todosTags_wrapper'>
                                                    {todo.tags.map((tag: any) => (
                                                        <div key={tag.id} className="tag">
                                                            {tag.name}
                                                        </div>))}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="tags_container">
                                    <h1>
                                        My tags
                                    </h1>
                                    <button onClick={createTag}>
                                        + new tag
                                    </button>
                                    <ul className="tagsList">
                                        {tags.map((tag) => (
                                            <li key={tag.id}>
                                                {tag.name}
                                                <div className="tagsButtons_wrapper">
                                                    <button onClick={() => deleteTag(tag.id)}>Delete</button>
                                                    <button
                                                        onClick={() => updateTag(tag.id, tag.name || '')}>Update
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {
                                displayForm && (
                                    <div className="createTodo_form">
                                        <div className="form_container">
                                            <button className="closeForm_button"
                                                    onClick={() => setDisplayForm(false)}
                                            >
                                                X
                                            </button>
                                            <h3>
                                                Create todo
                                            </h3>
                                            <form onSubmit={handleSubmit} className="form_wrapper">
                                                <div>
                                                    <label htmlFor="content">
                                                        <input type="text" id="content" name="content"
                                                               placeholder={'Enter todo content'}
                                                               required
                                                        />
                                                    </label>
                                                </div>
                                                <div>
                                                    <div className="selectTag_container">
                                                        <h4>
                                                            Select tag :
                                                        </h4>
                                                        <div className="selectTag_wrapper">
                                                            {tags.map((tag) => (
                                                                <div key={tag.id}>
                                                                    <input
                                                                        type="checkbox"
                                                                        id={tag.id}
                                                                        name="tags"
                                                                        value={tag.id}
                                                                    />
                                                                    <label htmlFor={tag.id}>
                                                                        {tag.name}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button type={"submit"}>Create</button>
                                            </form>
                                        </div>
                                    </div>
                                )
                            }
                        </main>
                    </>
                )
            }}
        </Authenticator>
    );
}

export default App;
