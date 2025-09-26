// Use the label of your Jenkins worker node
pipeline {
    agent { label 'ec2-worker' } 
    options {
        // Automatically check out the code before the stages start
        skipDefaultCheckout true 
    }
    environment {
        // Replace with your ECR URI and AWS region
        ECR_REGISTRY = '<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com'
        IMAGE_NAME = 'my-app-repo'
        IMAGE_TAG = "latest-${env.BUILD_NUMBER}"
        EKS_CLUSTER_NAME = 'my-jenkins-eks'
        AWS_REGION = '<your-aws-region>'
        // This is the name of your Kubernetes deployment manifest
        K8S_DEPLOYMENT_FILE = 'deployment.yaml' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Ensure the workspace is clean and clone the code
                checkout scm 
            }
        }
        
        stage('Build Docker Image') {
            steps {
                // Use a shell script to build the image
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }
        
        stage('Login to ECR') {
            steps {
                // ECR login using AWS CLI on the EC2 worker (using its attached IAM role)
                sh """
                aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                """
            }
        }
        
        stage('Push to ECR') {
            steps {
                // Tag and Push the image
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${IMAGE_NAME}:latest"
                sh "docker push ${ECR_REGISTRY}/${IMAGE_NAME}:latest"
            }
        }
        
        stage('Deploy to EKS') {
            steps {
                script {
                    // Update EKS Kubeconfig on the worker node using its IAM role
                    sh "aws eks update-kubeconfig --name ${EKS_CLUSTER_NAME} --region ${AWS_REGION}"
                    
                    // Update the deployment manifest to use the new image tag
                    sh "kubectl set image deployment/my-app my-container=${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} -f ${K8S_DEPLOYMENT_FILE}"
                    
                    // Apply the deployment (or use the previous set image command which triggers a rollout)
                    // sh "kubectl apply -f ${K8S_DEPLOYMENT_FILE}"
                    
                    // Wait for the rollout to complete
                    sh "kubectl rollout status deployment/my-app"
                }
            }
        }
    }
}
