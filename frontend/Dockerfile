# Production Nginx container serving LeaveDesk React frontend
FROM nginx:alpine

# Copy pre-compiled production bundle
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
