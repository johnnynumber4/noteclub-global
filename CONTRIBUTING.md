# Contributing to NoteClub Modern

Thank you for your interest in contributing to NoteClub Modern! We welcome contributions from everyone.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/note-club-modern.git
   cd note-club-modern
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Set up your environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```
5. **Start the development server**
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow Next.js App Router patterns
- Use Tailwind CSS for styling
- Follow the existing code style and patterns

### Commit Messages
Use conventional commit format:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: formatting changes`
- `refactor: code refactoring`
- `test: add or update tests`

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clear, concise code
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run build
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Include screenshots for UI changes

## Areas for Contribution

### High Priority
- Authentication improvements
- Group management features
- Note editor enhancements
- Mobile responsiveness
- Performance optimizations

### Documentation
- API documentation
- Deployment guides
- User guides
- Code comments

### Testing
- Unit tests
- Integration tests
- E2E tests

## Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, etc.)
- Screenshots if applicable

## Feature Requests

When requesting features:
- Provide clear use case
- Explain the problem it solves
- Consider implementation complexity
- Check if it aligns with project goals

## Questions?

- Check existing [issues](https://github.com/your-username/note-club-modern/issues)
- Start a [discussion](https://github.com/your-username/note-club-modern/discussions)
- Join our community chat

Thank you for contributing! 🚀
